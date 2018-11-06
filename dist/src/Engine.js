"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const Handlebars = require("handlebars");
const fs = require("fs");
const path = require("path");
const TomgUtils = require("./Utils");
const changeCase = require("change-case");
class Engine {
    constructor(driver, Options) {
        this.driver = driver;
        this.Options = Options;
    }
    createModelFromDatabase() {
        return __awaiter(this, void 0, void 0, function* () {
            let dbModel = yield this.getEntitiesInfo(this.Options.databaseName, this.Options.host, this.Options.port, this.Options.user, this.Options.password, this.Options.schemaName, this.Options.ssl, this.Options.namingStrategy, this.Options.relationIds);
            if (dbModel.entities.length > 0) {
                this.createModelFromMetadata(dbModel);
            }
            else {
                TomgUtils.LogError("Tables not found in selected database. Skipping creation of typeorm model.", false);
            }
            return true;
        });
    }
    getEntitiesInfo(database, server, port, user, password, schemaName, ssl, namingStrategy, relationIds) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.driver.GetDataFromServer(database, server, port, user, password, schemaName, ssl, namingStrategy, relationIds);
        });
    }
    createModelFromMetadata(databaseModel) {
        this.createHandlebarsHelpers();
        let templatePath = path.resolve(__dirname, "../../src/entity.mst");
        let template = fs.readFileSync(templatePath, "UTF-8");
        let resultPath = this.Options.resultsPath;
        if (!fs.existsSync(resultPath))
            fs.mkdirSync(resultPath);
        let entitesPath = resultPath;
        if (!this.Options.noConfigs) {
            this.createTsConfigFile(resultPath);
            this.createTypeOrmConfig(resultPath);
            entitesPath = path.resolve(resultPath, "./entities");
            if (!fs.existsSync(entitesPath))
                fs.mkdirSync(entitesPath);
        }
        let compliedTemplate = Handlebars.compile(template, { noEscape: true });
        databaseModel.entities.forEach(element => {
            element.Imports = [];
            element.Columns.forEach(column => {
                column.relations.forEach(relation => {
                    if (element.EntityName !== relation.relatedTable) {
                        element.Imports.push(relation.relatedTable);
                    }
                });
            });
            element.GenerateConstructor = this.Options.constructor;
            element.Imports.filter(function (elem, index, self) {
                return index === self.indexOf(elem);
            });
            let casedFileName = "";
            switch (this.Options.convertCaseFile) {
                case "camel":
                    casedFileName = changeCase.camelCase(element.EntityName);
                    break;
                case "param":
                    casedFileName = changeCase.paramCase(element.EntityName);
                    break;
                case "pascal":
                    casedFileName = changeCase.pascalCase(element.EntityName);
                    break;
                case "none":
                    casedFileName = element.EntityName;
                    break;
            }
            let resultFilePath = path.resolve(entitesPath, casedFileName + ".ts");
            let rendered = compliedTemplate(element);
            fs.writeFileSync(resultFilePath, rendered, {
                encoding: "UTF-8",
                flag: "w"
            });
        });
    }
    createHandlebarsHelpers() {
        Handlebars.registerHelper("curly", open => {
            return open ? "{" : "}";
        });
        Handlebars.registerHelper("toEntityName", str => {
            let retStr = "";
            switch (this.Options.convertCaseEntity) {
                case "camel":
                    retStr = changeCase.camelCase(str);
                    break;
                case "pascal":
                    retStr = changeCase.pascalCase(str);
                    break;
                case "none":
                    retStr = str;
                    break;
            }
            return retStr;
        });
        Handlebars.registerHelper("concat", (stra, strb) => {
            return stra + strb;
        });
        Handlebars.registerHelper("toFileName", str => {
            let retStr = "";
            switch (this.Options.convertCaseFile) {
                case "camel":
                    retStr = changeCase.camelCase(str);
                    break;
                case "param":
                    retStr = changeCase.paramCase(str);
                    break;
                case "pascal":
                    retStr = changeCase.pascalCase(str);
                    break;
                case "none":
                    retStr = str;
                    break;
            }
            return retStr;
        });
        Handlebars.registerHelper("printPropertyVisibility", () => this.Options.propertyVisibility !== "none"
            ? this.Options.propertyVisibility + " "
            : "");
        Handlebars.registerHelper("toPropertyName", str => {
            let retStr = "";
            switch (this.Options.convertCaseProperty) {
                case "camel":
                    retStr = changeCase.camelCase(str);
                    break;
                case "pascal":
                    retStr = changeCase.pascalCase(str);
                    break;
                case "none":
                    retStr = str;
                    break;
            }
            return retStr;
        });
        Handlebars.registerHelper("toLowerCase", str => {
            return str.toLowerCase();
        });
        Handlebars.registerHelper("toLazy", str => {
            if (this.Options.lazy)
                return `Promise<${str}>`;
            else
                return str;
        });
        Handlebars.registerHelper({
            eq: function (v1, v2) {
                return v1 === v2;
            },
            ne: function (v1, v2) {
                return v1 !== v2;
            },
            lt: function (v1, v2) {
                return v1 < v2;
            },
            gt: function (v1, v2) {
                return v1 > v2;
            },
            lte: function (v1, v2) {
                return v1 <= v2;
            },
            gte: function (v1, v2) {
                return v1 >= v2;
            },
            and: function (v1, v2) {
                return v1 && v2;
            },
            or: function (v1, v2) {
                return v1 || v2;
            }
        });
    }
    //TODO:Move to mustache template file
    createTsConfigFile(resultPath) {
        fs.writeFileSync(path.resolve(resultPath, "tsconfig.json"), `{"compilerOptions": {
        "lib": ["es5", "es6"],
        "target": "es6",
        "module": "commonjs",
        "moduleResolution": "node",
        "emitDecoratorMetadata": true,
        "experimentalDecorators": true,
        "sourceMap": true
    }}`, { encoding: "UTF-8", flag: "w" });
    }
    createTypeOrmConfig(resultPath) {
        if (this.Options.schemaName == "") {
            fs.writeFileSync(path.resolve(resultPath, "ormconfig.json"), `[
  {
    "name": "default",
    "type": "${this.Options.databaseType}",
    "host": "${this.Options.host}",
    "port": ${this.Options.port},
    "username": "${this.Options.user}",
    "password": "${this.Options.password}",
    "database": "${this.Options.databaseName}",
    "synchronize": false,
    "entities": [
      "entities/*.js"
    ]
  }
]`, { encoding: "UTF-8", flag: "w" });
        }
        else {
            fs.writeFileSync(path.resolve(resultPath, "ormconfig.json"), `[
  {
    "name": "default",
    "type": "${this.Options.databaseType}",
    "host": "${this.Options.host}",
    "port": ${this.Options.port},
    "username": "${this.Options.user}",
    "password": "${this.Options.password}",
    "database": "${this.Options.databaseName}",
    "schema": "${this.Options.schemaName}",
    "synchronize": false,
    "entities": [
      "entities/*.js"
    ]
  }
]`, { encoding: "UTF-8", flag: "w" });
        }
    }
}
exports.Engine = Engine;
//# sourceMappingURL=Engine.js.map