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
const AbstractDriver_1 = require("./AbstractDriver");
const ColumnInfo_1 = require("../models/ColumnInfo");
const EntityInfo_1 = require("../models/EntityInfo");
const TomgUtils = require("../Utils");
class SqliteDriver extends AbstractDriver_1.AbstractDriver {
    constructor() {
        super(...arguments);
        this.sqlite = require("sqlite3").verbose();
        this.tablesWithGeneratedPrimaryKey = new Array();
    }
    GetAllTables(schema) {
        return __awaiter(this, void 0, void 0, function* () {
            let ret = [];
            let rows = yield this.ExecQuery(`SELECT tbl_name, sql FROM "sqlite_master" WHERE "type" = 'table'  AND name NOT LIKE 'sqlite_%'`);
            rows.forEach(val => {
                let ent = new EntityInfo_1.EntityInfo();
                ent.EntityName = val.tbl_name;
                ent.Columns = [];
                ent.Indexes = [];
                if (val.sql.includes("AUTOINCREMENT")) {
                    this.tablesWithGeneratedPrimaryKey.push(ent.EntityName);
                }
                ret.push(ent);
            });
            return ret;
        });
    }
    GetCoulmnsFromEntity(entities, schema) {
        return __awaiter(this, void 0, void 0, function* () {
            for (const ent of entities) {
                let response = yield this.ExecQuery(`PRAGMA table_info('${ent.EntityName}');`);
                response.forEach(resp => {
                    let colInfo = new ColumnInfo_1.ColumnInfo();
                    colInfo.tsName = resp.name;
                    colInfo.sqlName = resp.name;
                    colInfo.is_nullable = resp.notnull == 0;
                    colInfo.isPrimary = resp.pk > 0;
                    colInfo.default = resp.dflt_value ? resp.dflt_value : null;
                    colInfo.sql_type = resp.type
                        .replace(/\([0-9 ,]+\)/g, "")
                        .toLowerCase()
                        .trim();
                    colInfo.is_generated =
                        colInfo.isPrimary &&
                            this.tablesWithGeneratedPrimaryKey.includes(ent.EntityName);
                    switch (colInfo.sql_type) {
                        case "int":
                            colInfo.ts_type = "number";
                            break;
                        case "integer":
                            colInfo.ts_type = "number";
                            break;
                        case "int2":
                            colInfo.ts_type = "number";
                            break;
                        case "int8":
                            colInfo.ts_type = "number";
                            break;
                        case "tinyint":
                            colInfo.ts_type = "number";
                            break;
                        case "smallint":
                            colInfo.ts_type = "number";
                            break;
                        case "mediumint":
                            colInfo.ts_type = "number";
                            break;
                        case "bigint":
                            colInfo.ts_type = "string";
                            break;
                        case "unsigned big int":
                            colInfo.ts_type = "string";
                            break;
                        case "character":
                            colInfo.ts_type = "string";
                            break;
                        case "varchar":
                            colInfo.ts_type = "string";
                            break;
                        case "varying character":
                            colInfo.ts_type = "string";
                            break;
                        case "nchar":
                            colInfo.ts_type = "string";
                            break;
                        case "native character":
                            colInfo.ts_type = "string";
                            break;
                        case "nvarchar":
                            colInfo.ts_type = "string";
                            break;
                        case "text":
                            colInfo.ts_type = "string";
                            break;
                        case "blob":
                            colInfo.ts_type = "Buffer";
                            break;
                        case "clob":
                            colInfo.ts_type = "string";
                            break;
                        case "real":
                            colInfo.ts_type = "number";
                            break;
                        case "double":
                            colInfo.ts_type = "number";
                            break;
                        case "double precision":
                            colInfo.ts_type = "number";
                            break;
                        case "float":
                            colInfo.ts_type = "number";
                            break;
                        case "numeric":
                            colInfo.ts_type = "number";
                            break;
                        case "decimal":
                            colInfo.ts_type = "number";
                            break;
                        case "boolean":
                            colInfo.ts_type = "boolean";
                            break;
                        case "date":
                            colInfo.ts_type = "string";
                            break;
                        case "datetime":
                            colInfo.ts_type = "Date";
                            break;
                        default:
                            console.log(colInfo.sql_type.toLowerCase().trim());
                            TomgUtils.LogError(`Unknown column type: ${colInfo.sql_type}  table name: ${ent.EntityName} column name: ${resp.name}`);
                            break;
                    }
                    let options = resp.type.match(/\([0-9 ,]+\)/g);
                    if (this.ColumnTypesWithPrecision.some(v => v == colInfo.sql_type) &&
                        options) {
                        colInfo.numericPrecision = options[0]
                            .substring(1, options[0].length - 1)
                            .split(",")[0];
                        colInfo.numericScale = options[0]
                            .substring(1, options[0].length - 1)
                            .split(",")[1];
                    }
                    if (this.ColumnTypesWithLength.some(v => v == colInfo.sql_type) &&
                        options) {
                        colInfo.lenght = options[0].substring(1, options[0].length - 1);
                    }
                    if (this.ColumnTypesWithWidth.some(v => v == colInfo.sql_type &&
                        colInfo.ts_type != "boolean") &&
                        options) {
                        colInfo.width = options[0].substring(1, options[0].length - 1);
                    }
                    if (colInfo.sql_type)
                        ent.Columns.push(colInfo);
                });
            }
            return entities;
        });
    }
    GetIndexesFromEntity(entities, schema) {
        return __awaiter(this, void 0, void 0, function* () {
            for (const ent of entities) {
                let response = yield this.ExecQuery(`PRAGMA index_list('${ent.EntityName}');`);
                for (const resp of response) {
                    let indexColumnsResponse = yield this.ExecQuery(`PRAGMA index_info('${resp.name}');`);
                    indexColumnsResponse.forEach(element => {
                        let indexInfo = {};
                        let indexColumnInfo = {};
                        if (ent.Indexes.filter(filterVal => {
                            return filterVal.name == resp.name;
                        }).length > 0) {
                            indexInfo = ent.Indexes.filter(filterVal => {
                                return filterVal.name == resp.name;
                            })[0];
                        }
                        else {
                            indexInfo.columns = [];
                            indexInfo.name = resp.name;
                            indexInfo.isUnique = resp.unique == 1;
                            ent.Indexes.push(indexInfo);
                        }
                        indexColumnInfo.name = element.name;
                        if (indexColumnsResponse.length == 1 &&
                            indexInfo.isUnique) {
                            ent.Columns.filter(v => v.tsName == indexColumnInfo.name).map(v => (v.is_unique = true));
                        }
                        indexInfo.columns.push(indexColumnInfo);
                    });
                }
            }
            return entities;
        });
    }
    GetRelations(entities, schema) {
        return __awaiter(this, void 0, void 0, function* () {
            for (const entity of entities) {
                let response = yield this.ExecQuery(`PRAGMA foreign_key_list('${entity.EntityName}');`);
                let relationsTemp = [];
                response.forEach(resp => {
                    let rels = {};
                    rels.ownerColumnsNames = [];
                    rels.referencedColumnsNames = [];
                    rels.actionOnDelete =
                        resp.on_delete == "NO ACTION" ? null : resp.on_delete;
                    rels.actionOnUpdate =
                        resp.on_update == "NO ACTION" ? null : resp.on_update;
                    rels.ownerTable = entity.EntityName;
                    rels.referencedTable = resp.table;
                    relationsTemp.push(rels);
                    rels.ownerColumnsNames.push(resp.from);
                    rels.referencedColumnsNames.push(resp.to);
                });
                entities = this.GetRelationsFromRelationTempInfo(relationsTemp, entities);
            }
            return entities;
        });
    }
    DisconnectFromServer() {
        return __awaiter(this, void 0, void 0, function* () {
            this.db.close();
        });
    }
    ConnectToServer(database, server, port, user, password, ssl) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.UseDB(database);
        });
    }
    CreateDB(dbName) {
        return __awaiter(this, void 0, void 0, function* () { });
    }
    UseDB(dbName) {
        return __awaiter(this, void 0, void 0, function* () {
            let promise = new Promise((resolve, reject) => {
                this.db = new this.sqlite.Database(dbName, err => {
                    if (err) {
                        console.error(err.message);
                        reject(err);
                        return;
                    }
                    resolve();
                });
            });
            return promise;
        });
    }
    DropDB(dbName) {
        return __awaiter(this, void 0, void 0, function* () { });
    }
    CheckIfDBExists(dbName) {
        return __awaiter(this, void 0, void 0, function* () {
            return true;
        });
    }
    ExecQuery(sql) {
        return __awaiter(this, void 0, void 0, function* () {
            let ret;
            let promise = new Promise((resolve, reject) => {
                this.db.serialize(() => {
                    this.db.all(sql, [], function (err, row) {
                        if (!err) {
                            ret = row;
                            resolve(true);
                        }
                        else {
                            TomgUtils.LogError("Error executing query on SQLite.", false, err.message);
                            reject(err);
                        }
                    });
                });
            });
            yield promise;
            return ret;
        });
    }
}
exports.SqliteDriver = SqliteDriver;
//# sourceMappingURL=SqliteDriver.js.map