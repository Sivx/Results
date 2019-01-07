#include <stdio.h>
#include <stdlib.h>
#include <unistd.h>
#include <errno.h>
#include <string.h>
#include <fcntl.h>
#include <signal.h>
#include <sys/types.h>
#include <sys/socket.h>
#include <netinet/in.h>
#include <arpa/inet.h>

#define BUFSIZE 8096
#define ERROR 42
#define SORRY 43
#define LOG   44
#ifndef SIGCLD
#   define SIGCLD SIGCHLD
#endif

typedef int bool;
#define true 1
#define false 0

#define MAXLINE 1024

struct key_value
{
   char* key;
   char* value;
};

#define MAX_CONFIG_LENGTH 50
struct key_value extensions[MAX_CONFIG_LENGTH];
struct key_value commands[MAX_CONFIG_LENGTH];

static void insert(struct key_value *k, char *key, char *value)
{
  k->key = key;
  k->value = value;
}

void config(char *filename, struct key_value *set_me)
{
	  FILE* fp;
    char  line[255];

    fp = fopen(filename , "r");
	  int x = 0;
    while (fgets(line, sizeof(line), fp) != NULL)
    {
      size_t len = strlen(line);
      if (len > 0 && line[len-1] == '\n') {
        line[--len] = '\0';
      }
        const char* val1 = strdup(strtok(line, "="));
        const char* val2 = strtok(NULL, "=");
        if(val2 !=0)val2=strdup(val2);
        //printf("%s|%s at index %i\n", val1, val2,x);
        set_me[x].key = val1;
        set_me[x].value = val2;
        //insert(&set_me[x],val1,val2);
        x++;
        //printf("%s|%s\n", val1, val2);
    }
	set_me[x].key = 0;
}

void log(int type, char *s1, char *s2, int num)
{
	int fd ;
	char logbuffer[BUFSIZE*2];

	switch (type) {
	case ERROR: (void)sprintf(logbuffer,"ERROR: %s:%s Errno=%d exiting pid=%d",s1, s2, errno,getpid()); break;
	case SORRY:
		(void)sprintf(logbuffer, "<HTML><BODY><H1>Sivx-Results Web Server Sorry: %s %s</H1></BODY></HTML>\r\n", s1, s2);
		(void)write(num,logbuffer,strlen(logbuffer));
		(void)sprintf(logbuffer,"SORRY: %s:%s",s1, s2);
		break;
	case LOG: (void)sprintf(logbuffer," INFO: %s:%s:%d",s1, s2,num); break;
	}
	/* no checks here, nothing can be done a failure anyway */
	if((fd = open("zsivxresults.log", O_CREAT| O_WRONLY | O_APPEND,0644)) >= 0) {
		(void)write(fd,logbuffer,strlen(logbuffer));
		(void)write(fd,"\n",1);
		(void)close(fd);
	}
	if(type == ERROR || type == SORRY) exit(3);
}

void url_decode(char* src, char* dest, int max) {
    char *p = src;
    char code[3] = { 0 };
    while(*p && --max) {
        if(*p == '%') {
            memcpy(code, ++p, 2);
            *dest++ = (char)strtoul(code, NULL, 16);
            p += 2;
        } else {
            *dest++ = *p++;
        }
    }
    *dest = '\0';
}

/* this is a child web server process, so we can exit on errors */
void web(int fd, int hit)
{
	int j, file_fd, buflen, len;
	long i, ret;
	char * fstr;
	static char buffer[BUFSIZE+1]; /* static so zero filled */

	ret =read(fd,buffer,BUFSIZE); 	/* read Web request in one go */
	if(ret == 0 || ret == -1) {	/* read failure stop now */
		log(SORRY,"failed to read browser request","",fd);
	}
	if(ret > 0 && ret < BUFSIZE)	/* return code is valid chars */
		buffer[ret]=0;		/* terminate the buffer */
	else buffer[0]=0;

	for(i=0;i<ret;i++)	/* remove CF and LF characters */
		if(buffer[i] == '\r' || buffer[i] == '\n')
			buffer[i]='*';
	//log(LOG,"request",buffer,hit);

	if( strncmp(buffer,"GET ",4) && strncmp(buffer,"get ",4) )
		log(SORRY,"Only simple GET operation supported",buffer,fd);

	for(i=4;i<BUFSIZE;i++) { /* null terminate after the second space to ignore extra stuff */
		if(buffer[i] == ' ') { /* string is "GET URL " +lots of other stuff */
			buffer[i] = 0;
			break;
		}
	}

	for(j=0;j<i-1;j++) 	/* check for illegal parent directory use .. */
		if(buffer[j] == '.' && buffer[j+1] == '.')
			log(SORRY,"Parent directory (..) path names not supported",buffer,fd);

	if( !strncmp(&buffer[0],"GET /\0",6) || !strncmp(&buffer[0],"get /\0",6) ) /* convert no filename to index file */
		(void)strcpy(buffer,"GET /index.html");

	int whitelisted = 0;

  for(i=0;commands[i].key != 0;i++) {
      len = strlen(commands[i].key);
      if(len == 0)break;
      if(strncmp(&buffer[5], commands[i].key, len) == 0) {
        log(LOG,"Matched Command",commands[i].key,len);
        whitelisted=1;
        break;
      }
  }

    if(whitelisted==1)
    {
        char* undecoded[strlen(&buffer[5]) + 1];
        url_decode(&buffer[5], &undecoded, BUFSIZE);
        log(LOG,"Search request",undecoded,fd);
        FILE *fp;
        /* Open the command for reading. */
        fp = popen(undecoded, "r");
        if (fp == NULL) {
            log(SORRY,"Command Failed",undecoded,fd);
        }
        else
        {
            char buf[MAXLINE];
            char *str = NULL;
            char *temp = NULL;
            unsigned int size = 1;  // start with size of 1 to make room for null terminator
            unsigned int strlength;

            while (fgets(buf, sizeof(buf), fp) != NULL) {
                strlength = strlen(buf);
                temp = (char*)realloc(str, size + strlength);  // allocate room for the buf that gets appended
                if (temp == NULL) {
                    log(SORRY,"Command Failed: Allocation Error.",undecoded,fd);
                } else {
                    str = temp;
                }
                strcpy(str + size - 1, buf);     // append buffer to str
                size += strlength;
            }
            log(LOG,"SEND Command",undecoded,hit);

            (void)sprintf(buffer,"HTTP/1.0 200 OK\r\nContent-Type: text/plain\r\n\r\n");
            (void)write(fd,buffer,strlen(buffer));

            char *beginning = str;//resetting point position? is that a thing :)
            unsigned int remain = strlen(beginning);
            char bbuf[MAXLINE];
            //char *send_buf = buf;//resetting point position? is that a thing :)
            while(remain)
            {
                int toCpy = remain > sizeof(bbuf) ? sizeof(bbuf) : remain;
                memcpy(bbuf, beginning, toCpy);
                beginning += toCpy;
                remain -= toCpy;
                (void)write(fd,bbuf,toCpy);
            }
        }
    }
    else
    {
        /* work out the file type and check we support it */
        buflen=strlen(buffer);
        fstr = (char *)0;
        for(i=0;extensions[i].key != 0;i++) {
            len = strlen(extensions[i].key);
            if( !strncmp(&buffer[buflen-len], extensions[i].key, len)) {
                fstr =extensions[i].value;
                break;
            }
        }

        if(fstr == 0) log(SORRY,"file extension type not supported",buffer,fd);

        char* public_path;// = concat("public/", &buffer[5]);
        asprintf(&public_path, "%s%s", "public/", &buffer[5]);
        if(( file_fd = open(public_path,O_RDONLY)) == -1) /* open the file for reading */
            log(SORRY, "failed to open file",public_path,fd);

        log(LOG,"SEND",public_path,hit);
        free(public_path);
        (void)sprintf(buffer,"HTTP/1.0 200 OK\r\nContent-Type: %s\r\n\r\n", fstr);
        (void)write(fd,buffer,strlen(buffer));

        /* send file in 8KB block - last block may be smaller */
        while ((ret = read(file_fd, buffer, BUFSIZE)) > 0 ) {
            (void)write(fd,buffer,ret);
        }
    }
#ifdef LINUX
	sleep(1);	/* to allow socket to drain */
#endif
	exit(1);
}


int main(int argc, char **argv)
{
	config("config/mime.cfg", extensions);
	config("config/commands.cfg", commands);
	int i, port, pid, listenfd, socketfd, hit;
	size_t length;
	static struct sockaddr_in cli_addr; /* static = initialised to zeros */
	static struct sockaddr_in serv_addr; /* static = initialised to zeros */
	/* Become deamon + unstopable and no zombies children (= no wait()) */
    port = atoi(argv[1]);
	if(fork() != 0)
		return 0; /* parent returns OK to shell */
	(void)signal(SIGCLD, SIG_IGN); /* ignore child death */
	(void)signal(SIGHUP, SIG_IGN); /* ignore terminal hangups */
	for(i=0;i<32;i++)
		(void)close(i);		/* close open files */
	(void)setpgrp();		/* break away from process group */
    //puts(argv[1]);
	//log(LOG,"nweb starting",port,getpid());
	/* setup the network socket */
	if((listenfd = socket(AF_INET, SOCK_STREAM,0)) <0)
		log(ERROR, "system call","socket",0);
	serv_addr.sin_family = AF_INET;
	serv_addr.sin_addr.s_addr = htonl(INADDR_ANY);
	serv_addr.sin_port = htons(port);
	if(bind(listenfd, (struct sockaddr *)&serv_addr,sizeof(serv_addr)) <0)
		log(ERROR,"system call","bind",0);
	if( listen(listenfd,64) <0)
		log(ERROR,"system call","listen",0);

	for(hit=1; ;hit++) {
		length = sizeof(cli_addr);
		if((socketfd = accept(listenfd, (struct sockaddr *)&cli_addr, &length)) < 0)
			log(ERROR,"system call","accept",0);

		if((pid = fork()) < 0) {
			log(ERROR,"system call","fork",0);
		}
		else {
			if(pid == 0) { 	/* child */
				(void)close(listenfd);
				web(socketfd,hit); /* never returns */
			} else { 	/* parent */
				(void)close(socketfd);
			}
		}
	}
}
