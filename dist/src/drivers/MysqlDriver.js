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
const MYSQL = require("mysql");
const ColumnInfo_1 = require("../models/ColumnInfo");
const TomgUtils = require("../Utils");
class MysqlDriver extends AbstractDriver_1.AbstractDriver {
    constructor() {
        super(...arguments);
        this.EngineName = "MySQL";
        this.GetAllTablesQuery = (schema) => __awaiter(this, void 0, void 0, function* () {
            let response = this.ExecQuery(`SELECT TABLE_SCHEMA, TABLE_NAME
            FROM information_schema.tables
            WHERE table_type='BASE TABLE'
            AND table_schema like DATABASE()`);
            return response;
        });
    }
    GetCoulmnsFromEntity(entities, schema) {
        return __awaiter(this, void 0, void 0, function* () {
            let response = yield this.ExecQuery(`SELECT TABLE_NAME,COLUMN_NAME,COLUMN_DEFAULT,IS_NULLABLE,
            DATA_TYPE,CHARACTER_MAXIMUM_LENGTH,NUMERIC_PRECISION,NUMERIC_SCALE,
            CASE WHEN EXTRA like '%auto_increment%' THEN 1 ELSE 0 END IsIdentity, column_type, column_key
            FROM INFORMATION_SCHEMA.COLUMNS where TABLE_SCHEMA like DATABASE()`);
            entities.forEach(ent => {
                response
                    .filter(filterVal => {
                    return filterVal.TABLE_NAME == ent.EntityName;
                })
                    .forEach(resp => {
                    let colInfo = new ColumnInfo_1.ColumnInfo();
                    colInfo.tsName = resp.COLUMN_NAME;
                    colInfo.sqlName = resp.COLUMN_NAME;
                    colInfo.is_nullable = resp.IS_NULLABLE == "YES";
                    colInfo.is_generated = resp.IsIdentity == 1;
                    colInfo.is_unique = resp.column_key == "UNI";
                    colInfo.default = resp.COLUMN_DEFAULT;
                    colInfo.sql_type = resp.DATA_TYPE;
                    switch (resp.DATA_TYPE) {
                        case "int":
                            colInfo.ts_type = "number";
                            break;
                        case "tinyint":
                            if (resp.column_type == "tinyint(1)") {
                                colInfo.width = 1;
                                colInfo.ts_type = "boolean";
                            }
                            else {
                                colInfo.ts_type = "number";
                            }
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
                        case "float":
                            colInfo.ts_type = "number";
                            break;
                        case "double":
                            colInfo.ts_type = "number";
                            break;
                        case "decimal":
                            colInfo.ts_type = "string";
                            break;
                        case "date":
                            colInfo.ts_type = "string";
                            break;
                        case "datetime":
                            colInfo.ts_type = "Date";
                            break;
                        case "timestamp":
                            colInfo.ts_type = "Date";
                            break;
                        case "time":
                            colInfo.ts_type = "string";
                            break;
                        case "year":
                            colInfo.ts_type = "number";
                            break;
                        case "char":
                            colInfo.ts_type = "string";
                            break;
                        case "varchar":
                            colInfo.ts_type = "string";
                            break;
                        case "blob":
                            colInfo.ts_type = "Buffer";
                            break;
                        case "text":
                            colInfo.ts_type = "string";
                            break;
                        case "tinyblob":
                            colInfo.ts_type = "Buffer";
                            break;
                        case "tinytext":
                            colInfo.ts_type = "string";
                            break;
                        case "mediumblob":
                            colInfo.ts_type = "Buffer";
                            break;
                        case "mediumtext":
                            colInfo.ts_type = "string";
                            break;
                        case "longblob":
                            colInfo.ts_type = "Buffer";
                            break;
                        case "longtext":
                            colInfo.ts_type = "string";
                            break;
                        case "enum":
                            colInfo.ts_type = "string";
                            colInfo.enumOptions = resp.column_type
                                .substring(5, resp.column_type.length - 1)
                                .replace(/\'/gi, '"');
                            break;
                        case "json":
                            colInfo.ts_type = "Object";
                            break;
                        case "binary":
                            colInfo.ts_type = "Buffer";
                            break;
                        case "geometry":
                            colInfo.ts_type = "string";
                            break;
                        case "point":
                            colInfo.ts_type = "string";
                            break;
                        case "linestring":
                            colInfo.ts_type = "string";
                            break;
                        case "polygon":
                            colInfo.ts_type = "string";
                            break;
                        case "multipoint":
                            colInfo.ts_type = "string";
                            break;
                        case "multilinestring":
                            colInfo.ts_type = "string";
                            break;
                        case "multipolygon":
                            colInfo.ts_type = "string";
                            break;
                        case "geometrycollection":
                            colInfo.ts_type = "string";
                            break;
                        default:
                            TomgUtils.LogError(`Unknown column type: ${resp.DATA_TYPE}  table name: ${resp.TABLE_NAME} column name: ${resp.COLUMN_NAME}`);
                            break;
                    }
                    if (this.ColumnTypesWithPrecision.some(v => v == colInfo.sql_type)) {
                        colInfo.numericPrecision = resp.NUMERIC_PRECISION;
                        colInfo.numericScale = resp.NUMERIC_SCALE;
                    }
                    if (this.ColumnTypesWithLength.some(v => v == colInfo.sql_type)) {
                        colInfo.lenght =
                            resp.CHARACTER_MAXIMUM_LENGTH > 0
                                ? resp.CHARACTER_MAXIMUM_LENGTH
                                : null;
                    }
                    if (this.ColumnTypesWithWidth.some(v => v == colInfo.sql_type &&
                        colInfo.ts_type != "boolean")) {
                        colInfo.width =
                            resp.CHARACTER_MAXIMUM_LENGTH > 0
                                ? resp.CHARACTER_MAXIMUM_LENGTH
                                : null;
                    }
                    if (colInfo.sql_type)
                        ent.Columns.push(colInfo);
                });
            });
            return entities;
        });
    }
    GetIndexesFromEntity(entities, schema) {
        return __awaiter(this, void 0, void 0, function* () {
            let response = yield this.ExecQuery(`SELECT TABLE_NAME TableName,INDEX_NAME IndexName,COLUMN_NAME ColumnName,CASE WHEN NON_UNIQUE=0 THEN 1 ELSE 0 END is_unique,
            CASE WHEN INDEX_NAME='PRIMARY' THEN 1 ELSE 0 END is_primary_key
            FROM information_schema.statistics sta
            WHERE table_schema like DATABASE();
            `);
            entities.forEach(ent => {
                response
                    .filter(filterVal => {
                    return filterVal.TableName == ent.EntityName;
                })
                    .forEach(resp => {
                    let indexInfo = {};
                    let indexColumnInfo = {};
                    if (ent.Indexes.filter(filterVal => {
                        return filterVal.name == resp.IndexName;
                    }).length > 0) {
                        indexInfo = ent.Indexes.filter(filterVal => {
                            return filterVal.name == resp.IndexName;
                        })[0];
                    }
                    else {
                        indexInfo.columns = [];
                        indexInfo.name = resp.IndexName;
                        indexInfo.isUnique = resp.is_unique == 1;
                        indexInfo.isPrimaryKey = resp.is_primary_key == 1;
                        ent.Indexes.push(indexInfo);
                    }
                    indexColumnInfo.name = resp.ColumnName;
                    indexInfo.columns.push(indexColumnInfo);
                });
            });
            return entities;
        });
    }
    GetRelations(entities, schema) {
        return __awaiter(this, void 0, void 0, function* () {
            let response = yield this.ExecQuery(`SELECT DISTINCT
            CU.TABLE_NAME TableWithForeignKey,
            CU.ORDINAL_POSITION FK_PartNo,
            CU.COLUMN_NAME ForeignKeyColumn,
            CU.REFERENCED_TABLE_NAME TableReferenced,
            CU.REFERENCED_COLUMN_NAME ForeignKeyColumnReferenced,
            RC.DELETE_RULE onDelete,
            RC.UPDATE_RULE onUpdate,
            CU.CONSTRAINT_NAME object_id
           FROM
            INFORMATION_SCHEMA.KEY_COLUMN_USAGE CU
           JOIN
            INFORMATION_SCHEMA.REFERENTIAL_CONSTRAINTS RC ON CU.CONSTRAINT_NAME=RC.CONSTRAINT_NAME
          WHERE
            TABLE_SCHEMA = SCHEMA()
            AND CU.REFERENCED_TABLE_NAME IS NOT NULL;
            `);
            let relationsTemp = [];
            response.forEach(resp => {
                let rels = relationsTemp.find(val => {
                    return val.object_id == resp.object_id;
                });
                if (rels == undefined) {
                    rels = {};
                    rels.ownerColumnsNames = [];
                    rels.referencedColumnsNames = [];
                    rels.actionOnDelete =
                        resp.onDelete == "NO_ACTION" ? null : resp.onDelete;
                    rels.actionOnUpdate =
                        resp.onUpdate == "NO_ACTION" ? null : resp.onUpdate;
                    rels.object_id = resp.object_id;
                    rels.ownerTable = resp.TableWithForeignKey;
                    rels.referencedTable = resp.TableReferenced;
                    relationsTemp.push(rels);
                }
                rels.ownerColumnsNames.push(resp.ForeignKeyColumn);
                rels.referencedColumnsNames.push(resp.ForeignKeyColumnReferenced);
            });
            entities = this.GetRelationsFromRelationTempInfo(relationsTemp, entities);
            return entities;
        });
    }
    DisconnectFromServer() {
        return __awaiter(this, void 0, void 0, function* () {
            let promise = new Promise((resolve, reject) => {
                this.Connection.end(err => {
                    if (!err) {
                        resolve(true);
                    }
                    else {
                        TomgUtils.LogError(`Error disconnecting to ${this.EngineName} Server.`, false, err.message);
                        reject(err);
                    }
                });
            });
            if (this.Connection)
                yield promise;
        });
    }
    ConnectToServer(database, server, port, user, password, ssl) {
        return __awaiter(this, void 0, void 0, function* () {
            let config;
            if (ssl) {
                config = {
                    database: database,
                    host: server,
                    port: port,
                    user: user,
                    password: password,
                    ssl: {
                        rejectUnauthorized: false
                    }
                };
            }
            else {
                config = {
                    database: database,
                    host: server,
                    port: port,
                    user: user,
                    password: password
                };
            }
            let promise = new Promise((resolve, reject) => {
                this.Connection = MYSQL.createConnection(config);
                this.Connection.connect(err => {
                    if (!err) {
                        resolve(true);
                    }
                    else {
                        TomgUtils.LogError(`Error connecting to ${this.EngineName} Server.`, false, err.message);
                        reject(err);
                    }
                });
            });
            yield promise;
        });
    }
    CreateDB(dbName) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.ExecQuery(`CREATE DATABASE ${dbName}; `);
        });
    }
    UseDB(dbName) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.ExecQuery(`USE ${dbName}; `);
        });
    }
    DropDB(dbName) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.ExecQuery(`DROP DATABASE ${dbName}; `);
        });
    }
    CheckIfDBExists(dbName) {
        return __awaiter(this, void 0, void 0, function* () {
            let resp = yield this.ExecQuery(`SHOW DATABASES LIKE '${dbName}' `);
            return resp.length > 0;
        });
    }
    ExecQuery(sql) {
        return __awaiter(this, void 0, void 0, function* () {
            let ret = [];
            let query = this.Connection.query(sql);
            let stream = query.stream({});
            let promise = new Promise((resolve, reject) => {
                stream.on("data", chunk => {
                    ret.push(chunk);
                });
                stream.on("error", err => reject(err));
                stream.on("end", () => resolve(true));
            });
            yield promise;
            return ret;
        });
    }
}
exports.MysqlDriver = MysqlDriver;
//# sourceMappingURL=MysqlDriver.js.map