all: wash-gen

wash-gen: src/generator.cpp
	clang++-3.6 src/generator.cpp -o wash-gen -I ../binaryen/src/ -L ../binaryen-11/lib -l binaryen --std=c++11
