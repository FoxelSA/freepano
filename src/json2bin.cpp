#include <fstream>
#include <sstream>
#include <iostream>
#include <cstdlib>
#include <stdint.h>
#include <cstring>
#include <list>
#include <cmath>

#define FILE_MARKER "\xF0\xE1"
#define FILE_VERSION "fpcl.0003" // increment this number when file format change !
#define FILE_HEADER_SIZE 16 // multiple of 8

char file_header[FILE_HEADER_SIZE];

std::stringstream *linestream;
std::string token = "";
const char *filename;

// return float from linestream
inline float getFloat() {
  if (!getline(*linestream, token, ',')) {
    std::cerr << "error: could not parse " << filename << std::endl ;
    exit(1);
  }
  return atof(token.c_str());
}

// return double from linestream
inline double getDouble() {
  if (!getline(*linestream, token, ',')) {
    std::cerr << "error: could not parse " << filename << std::endl ;
    exit(1);
  }
  return strtod(token.c_str(), NULL);
}

// return unsigned long from linestream
inline float getUlong() {
  if (!getline(*linestream, token, ',')) {
    std::cerr << "error: could not parse " << filename << std::endl ;
    exit(1);
  }
  return strtoul(token.c_str(),NULL,0);
}

// skip value from linestream
inline float skip() {
  if (!getline(*linestream, token, ',')) {
    std::cerr << "error: could not parse " << filename << std::endl ;
    exit(1);
  }
}

int main(int argc, char **argv) {

  std::string line = "";
  unsigned int index;
  float depth, theta, phi;
  double mn95_x, mn95_y, mn95_z;
  int lon, lat;
  float r=150.0; // webgl sphere radius
  float fx,fy,fz;
  std::list<uint32_t> sector[360][180];
  float step=M_PI/180.0;
  uint32_t point_index=0;
  unsigned long nb_points=0;

  if (argc!=2) {
    std::cerr << "usage: " << argv[0] << " <json_file>" << std::endl ;
    return 1;
  }

  // open json
  filename=argv[1];
  std::ifstream fs(filename);
  if (!fs.is_open()) {
    std::cerr << "could not open " << filename << std::endl ;
    return 1;
  }

  // extract "nb_points" from json
  while (getline(fs, line)) {
    if (const char *pos=strstr(line.c_str(),"nb_points")) {
      nb_points=strtoul(strchr(pos,':')+1,NULL,0);
      break;
    }
  }
  if (!nb_points) {
    std::cerr << "error: could not parse " << filename << std::endl ;
    return 1;
  }

  // remove input filename extension
  std::string fname=std::string(filename);
  fname.erase(fname.find_last_of("."),std::string::npos);

  // create .bin output file
  std::string outfname=fname+".bin";
  std::ofstream outf;
  outf.open(outfname.c_str());
  if (!outf.is_open()) {
    std::cerr << "could not open " << outfname << std::endl ;
    return 1;
  }

  std::cerr << filename << ": parsing " << nb_points << " points" << std::endl;

  // 1. parse lines beginning with [0-9] as a csv formatted as:
  // "depth, index, theta, phi, mn95-x, mn95-y, mn95-z" (floats)
  // 2. store cartesian coordinates in "sector" array as:
  // float x, float y, float z

  double *mn95=new double[nb_points*3];
  float *positions=new float[nb_points*3];

  while (getline(fs, line)) {

      // skip line not beginning with [0-9]
      if (line[0]<'0' || line[0]>'9') continue;

      if (point_index>= nb_points) {
        std::cerr << filename << ": error: nb_points is invalid ! " << std::endl;
        return 1;
      }

      // read line
      linestream=new std::stringstream(line);

      // extract fields
      depth=getFloat();
      index=getUlong();
      theta=getFloat();
      phi=getFloat();
      mn95_x=getDouble();
      mn95_y=getDouble();
      mn95_z=getDouble();

      // compute sector location
      lon=((int)round(theta/step)+180)%360;
      lat=round(phi/step);
      if (lat<0) lat+=180;
      lat=(180-lat)%180;

      // reference particle in sector lon,lat
      unsigned long k=point_index*3;
      sector[lon][lat].push_back(k);

      // compute cartesian webgl coordinates
      phi=(phi-M_PI/2);
      theta=theta-M_PI/2;
      fx=depth*sin(phi)*cos(theta);
      fz=depth*sin(phi)*sin(theta);
      fy=-depth*cos(phi);

      // store cartesian coordinates
      positions[k]=fx;
      positions[k+1]=fy;
      positions[k+2]=fz;

      // store mn95 coordinates
      mn95[k]=mn95_x;
      mn95[k+1]=mn95_y;
      mn95[k+2]=mn95_z;

      ++point_index;
  }

  if (point_index!=nb_points) {
    std::cerr << filename << ": error: nb_points is invalid !" << std::endl;
    return 1;
  }

  // file header
  strncpy(file_header,FILE_MARKER,2);
  strncat(file_header,FILE_VERSION,FILE_HEADER_SIZE-2);
  outf.write((char*)file_header,FILE_HEADER_SIZE);

  std::cerr << filename << ": converting to file version " << FILE_VERSION << std::endl;

  long int data_offset=outf.tellp();

  // output positions formatted as list of x,y,z for each [lon][lat] pair
  // and prepare a 360x180 array index formatted as offset,count

  std::list<uint32_t> array_index;

  for (lat=0; lat<180; ++lat) {
    for (lon=0; lon<360; ++lon) {

      std::list<uint32_t> *_sector=&sector[lon][lat];

      // update array index
      uint32_t particle_count=_sector->size();
      if (particle_count) {
        // particles in this sector: store offset and particle count
        array_index.push_back((outf.tellp()-data_offset)/sizeof(fx));
        array_index.push_back(particle_count);
      } else {
        // no particles here
        array_index.push_back(0);
        array_index.push_back(0);
        continue;
      }

      // output particle positions for sector[lon][lat]
      for (std::list<uint32_t>::iterator it=_sector->begin(); it!=_sector->end(); ++it) {
        uint32_t index=*it;
        outf.write((char*)&positions[index],sizeof(*positions)*3);
      }
    }
  }

  // check integrity
  unsigned long positions_byteCount=outf.tellp()-data_offset;
  int failure=(positions_byteCount/nb_points!=sizeof(*positions)*3);
  std::cerr << filename << ": positions -> " << positions_byteCount << " bytes" << (failure?" -> Invalid count !":"") << std::endl;
  if (failure) {
    return 1;
  }

  // align start of double array on 8 bytes
  unsigned long positions_filler=positions_byteCount%8;
  if (positions_filler) {
    outf.write("fillfill",8-positions_filler);
  }

  // output mn95 coordinates
  for (lat=0; lat<180; ++lat) {
    for (lon=0; lon<360; ++lon) {

      std::list<uint32_t> *_sector=&sector[lon][lat];

      if (!_sector->size()) {
        continue;
      }
      // output mn95 positions for sector[lon][lat]
      for (std::list<uint32_t>::iterator it=_sector->begin(); it!=_sector->end(); ++it) {
        uint32_t index=*it;
        outf.write((char*)&mn95[index],sizeof(*mn95)*3);
      }
    }
  }

  // check integrity
  long unsigned int mn95_byteCount=(unsigned long)outf.tellp()-data_offset-positions_byteCount-positions_filler;
  failure=(mn95_byteCount!=2*positions_byteCount);
  std::cerr << filename << ": mn95 -> " << mn95_byteCount << " bytes" << (failure?" -> Invalid count !":"") << std::endl;
  if (failure) {
    return 1;
  }

  // if alignment was needed before mn95 array, add it twice after (for proper table size computation in js) 
  if (positions_filler) {
    outf.write("fillfill",8-positions_filler);
    outf.write("fillfill",8-positions_filler);
  }

  // output index formatted as:
  // offset, particle_count
  for (std::list<uint32_t>::iterator it=array_index.begin(); it!=array_index.end(); ++it) {
    uint32_t value=*it;
    outf.write((char*)&value,sizeof(value));
  }

  // check integrity
  flush(outf);
  long unsigned int index_byteCount=(unsigned long)outf.tellp()-data_offset-positions_byteCount-mn95_byteCount-positions_filler*3;
  failure=(index_byteCount%4);
  std::cerr << filename << ": index -> " << index_byteCount << " bytes" << ((index_byteCount%4)?" -> not a multiple of 4 !":"") << std::endl;
  if (failure) {
    return 1;
  }

  outf.write((char*)FILE_MARKER,strlen(FILE_MARKER));
  outf.close();

  if (mn95_byteCount!=2*positions_byteCount) {
    std::cerr << "error: mn95_byteCount != 2*positions_byteCount ! " << std::endl;
    return 1;
  }

  return 0;

}


