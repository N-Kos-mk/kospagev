import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";

const SALT_ROUNDS = 12;

// NextResponse に変更。resultもJSON.stringifyしない
function errorTypemakes(message="", code=500, details=null) {
    return NextResponse.json(
        { "status": "failed", message, details },
        { headers: { "Access-Control-Allow-Origin": "*"}, status: code }
    );
}

function internalErrorResponse(message="", details=null) {
    return errorTypemakes(`Internal server error: ${message}`, 500, details);
}

const unauthorizedErrorResponse = (details=null) => {
    return errorTypemakes(`Unauthorized`, 401, details);
}

const InvalidParameterResponse = (details) => {
    return errorTypemakes("Invalid parameters", 400, details);
}

const databaseNotFoundResponse = () => {
    return errorTypemakes(`Database not found`, 500);
}

const databaseErrorResponse = (message="", details=null) => {
    return errorTypemakes(`Database error: ${message}`, 500, details);
}

// NextResponse に変更
const debugResponse = (message="", details=null) => {
    const result = { "result": "debug", "message": message, "details": details };
    return NextResponse.json(result, { headers: { "Access-Control-Allow-Origin": "*"}, status: 200 });
}

const errorResponse = {
    internalErrorResponse,
    unauthorizedErrorResponse,
    InvalidParameterResponse,
    databaseNotFoundResponse,
    databaseErrorResponse
};

// NextResponse に変更
const successResponse = (data, headers=null, status=200) => {
    const result = { "status": "success", "response_date": time2str(), "data": data }
    if (headers) {
        return NextResponse.json(
            result,
            {
                status: status,
                headers: headers
            }
        );
    }
    return NextResponse.json(
        result,
        {
            status: status,
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "GET, POST"
            }
        }
    );
}

function buildDebugSQL(sql, params) {
    let i = 0;
    return sql.replace(/\?/g, () => JSON.stringify(params[i++]));
}

function time2str() {
    const d = new Date();
    const pad = (n) => String(n).padStart(2, "0");
    return [
      d.getFullYear(),
      pad(d.getMonth() + 1),
      pad(d.getDate())
    ].join('-') +
    ' ' +
    [
      pad(d.getHours()),
      pad(d.getMinutes()),
      pad(d.getSeconds())
    ].join(':');
}

async function hashPassword(password) {
    return await bcrypt.hash(password, SALT_ROUNDS);;
}

async function verifyPassword(password, storedHash) {
    return await bcrypt.compare(password, storedHash);
}

export const utils = {
    // responses
    errorResponse,
    debugResponse,
    successResponse,
    
    // functions
    buildDebugSQL,
    time2str,
    hashPassword,
    verifyPassword,
};