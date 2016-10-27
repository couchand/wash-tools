#include <memory>

#include "wasm.h"
#include "wasm-binary.h"

namespace std {
template<typename T, typename... Args> std::unique_ptr<T> make_unique(Args&&... args) {
  return std::unique_ptr<T>(new T(std::forward<Args>(args)...));
}
}

class FunctionType {
public:
  std::vector<wasm::WasmType> params;
  wasm::WasmType result;

  FunctionType(std::vector<wasm::WasmType> p, wasm::WasmType r) : params(p), result(r) {}
};

class Import {
public:
  std::string module;
  std::string base;
  FunctionType type;

  Import(std::string m, std::string b, FunctionType t) : module(m), base(b), type(t) {}
};

class Export {
public:
  std::string base;
  FunctionType type;

  Export(std::string b, FunctionType t) : base(b), type(t) {}
};

class ModuleLoader {
private:
  std::unique_ptr<wasm::Module> module;

public:
  ModuleLoader(char *bytes, size_t count) : module(std::make_unique<wasm::Module>()) {
    std::vector<char> buffer(false);
    buffer.resize(count);
    std::copy_n(bytes, count, buffer.begin());
    try {
      wasm::WasmBinaryBuilder parser(*module, buffer, false);
      parser.read();
    } catch (wasm::ParseException& p) {
      std::cerr << "error in parsing wasm binary:  ";
      p.dump(std::cerr);
      module = NULL;
    }
  }

  std::vector<Import> getImports() {
    std::vector<Import> imports;

    if (module == NULL) return imports;

    for (unsigned i = 0, e = module->imports.size(); i < e; i += 1) {
      auto imp = module->getImport(i);

      std::vector<wasm::WasmType> params;
      for (auto p : imp->type->params) {
        params.push_back(p);
      }

      FunctionType ty(params, imp->type->result);

      imports.push_back(Import(imp->module.c_str(), imp->base.c_str(), ty));
    }

    return imports;
  }

  std::vector<Export> getExports() {
    std::vector<Export> exports;

    if (module == NULL) return exports;

    for (unsigned i = 0, e = module->exports.size(); i < e; i += 1) {
      auto exp = module->getExport(i);

      auto fn = module->getFunction(exp->value);

      std::vector<wasm::WasmType> params;
      for (auto p : fn->params) {
        params.push_back(p);
      }

      FunctionType ty(params, fn->result);

      exports.push_back(Export(exp->name.c_str(), ty));
    }

    return exports;
  }
};

static void ReadAllBytes(const char *filename, std::vector<char> &bytes) {
  std::ifstream input(filename, std::ios::binary|std::ios::ate);
  std::ifstream::pos_type size = input.tellg();

  bytes.resize(size);

  input.seekg(0, std::ios::beg);
  input.read(bytes.data(), size);
}

void printType(FunctionType ty, std::ostream &o) {
  if (ty.params.size() > 0) {
    o << " (param";
    for (auto p : ty.params) {
      o << " " << printWasmType(p);
    }
    o << ")";
  }
  if (ty.result != wasm::WasmType::none) {
    o << " (result " << printWasmType(ty.result) << ")";
  }
}

int main(int argc, const char **argv) {
  if (argc < 2) {
    std::cerr << "Must provide a filename!" << std::endl;
    return -1;
  }

  const char *filename = argv[1];
  std::vector<char> bytes;

  try {
    ReadAllBytes(filename, bytes);
  }
  catch (std::exception e) {
    std::cerr << "Error opening file " << filename << std::endl;
    return -2;
  }

  ModuleLoader loader(bytes.data(), bytes.size());

  std::cout << "(header" << std::endl;

  for (auto imp : loader.getImports()) {
    std::cout << "  (import \"" << imp.module << "\" \"" << imp.base << "\"";

    printType(imp.type, std::cout);

    std::cout << ")" << std::endl;
  }

  for (auto exp : loader.getExports()) {
    std::cout << "  (export \"" << exp.base << "\"";

    printType(exp.type, std::cout);

    std::cout << ")" << std::endl;
  }

  std::cout << ")" << std::endl;

  return 0;
}
