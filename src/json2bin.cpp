#include <fstream>
#include <sstream>
#include <iostream>
#include <cstdlib>
#include <stdint.h>
#include <cstring>
#include <list>
#include <cmath>

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
  int lon, lat;
  float r=150.0; // webgl sphere radius
  float fx,fy,fz;
  std::list<float> sector[360][180];
  float step=M_PI/180.0;
  unsigned long i=0;
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
    std::cerr << "error: could not parse" << filename << std::endl ;
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
  // "depth, index, theta, phi," (floats)
  // 2. store cartesian coordinates in "sector" array as:
  // float x, float y, float z

  while (getline(fs, line)) {

      if (line[0]<'0' || line[0]>'9') continue;
      linestream=new std::stringstream(line);
      depth=getFloat();
      index=getUlong();
      theta=getFloat();
      phi=getFloat();

      // convert to degrees
      lon=((int)round(theta/step))%360;
      lat=round(phi/step);
      if (lat<0) lat+=180;

      // reference particle in sector lon,lat
      std::list<float> *_sector=&sector[lon][lat];

      phi=(phi-M_PI/2);
      theta=theta-M_PI/2;
      // compute cartesian coordinates
      fx=r*sin(phi)*cos(theta);
      fz=r*sin(phi)*sin(theta);
      fy=-r*cos(phi);

      // store cartesian coordinates
      _sector->push_back(fx);
      _sector->push_back(fy);
      _sector->push_back(fz);

  }


  // output positions formatted as list of x,y,z for each [lon][lat] pair
  // and prepare a 360x180 array index formatted as offset,count
 
  std::list<uint32_t> array_index;

  for (lat=0; lat<180; ++lat) {
    for (lon=0; lon<360; ++lon) {

      std::list<float> *positions=&sector[lon][lat];

      // update array index
      uint32_t count=positions->size();
      if (count) {
        // particles in this sector: store file offset and particle count
        array_index.push_back(outf.tellp());
        array_index.push_back(count);
      } else {
        // no particles here
        array_index.push_back(0);
        array_index.push_back(0);
        continue;
      }

      // output particle positions for sector[lon][lat]
      for (std::list<float>::iterator it=positions->begin(); it!=positions->end(); ++it) {
        float value=*it;
        outf.write((char*)&value,sizeof(value));
      }
    }
  }

  // check integrity
  unsigned long count=outf.tellp();
  std::cerr << filename << ": positions -> " << count << " bytes" << ((count%4)?" not a multiple of 4 !":"") << std::endl;

  // output index formatted as:
  // offset, count
  for (std::list<uint32_t>::iterator it=array_index.begin(); it!=array_index.end(); ++it) {
    uint32_t value=*it;
    outf.write((char*)&value,sizeof(value));
  }

  // check integrity
  long unsigned int count2=(unsigned long)outf.tellp()-count;
  std::cerr << filename << ": index -> " << count2 << " bytes" << ((count2%4)?" not a multiple of 4 !":"") << std::endl;

  outf.close();
  return (count%4 + count2%4);

}


