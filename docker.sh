docker build -t noir-environment .
docker run -it --rm -v $(pwd):/home/noir/projects:rw noir-environment