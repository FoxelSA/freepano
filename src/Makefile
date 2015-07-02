
# target installation directories
export DESTDIR?=
export PREFIX?=/usr/local

BIN_DIR=${DESTDIR}/${PREFIX}/bin

# non-file targets
.PHONY: all clean build install uninstall

# targets
#

all: json2bin strip

install: all
	install -D json2bin ${BIN_DIR}/json2bin

strip: json2bin
	strip json2bin

uninstall:
	rm ${BIN_DIR}/json2bin


json2bin: Makefile json2bin.cpp
	g++ json2bin.cpp -g -static -std=c++11 -o json2bin

