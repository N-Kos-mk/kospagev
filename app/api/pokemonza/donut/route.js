export const runtime = "nodejs";
import { NextResponse } from "next/server";
import { utils } from "../../utils.js";
import { BerryDonutOptimizer } from "../pokemonza.functions.js";
import { pokemonzaSchemas } from "../pokemonza.schema.js";
import { berryData } from "../data/berryData.js";


const optimizer = new BerryDonutOptimizer(berryData);


// 許可する Origin のリスト。vercel用
const ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://localhost:8787",
    "https://kospage.nkos.workers.dev",
];

function getCorsHeaders(req) {
    const origin = req.headers.get("origin");
    if (ALLOWED_ORIGINS.includes(origin)) {
        return {
            "Access-Control-Allow-Origin": origin,
            "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type",
        };
    }
    return {};
}


export async function OPTIONS(req) {
    return new NextResponse(null, {
        status: 204,
        headers: getCorsHeaders(req),
    });
}


export async function POST(req) {
    try {
        const body = await req.json();
        // リクエストボディ検証
        const parseResult = pokemonzaSchemas.DONUT_RECIPE.safeParse(body);
        if (!parseResult.success) {
            //console.log(parseResult.error.errors);
            return utils.errorResponse.InvalidParameterResponse(parseResult.error.flatten());
        }
        const recipe = parseResult.data;
        // 最適化実行
        const result = optimizer.solve(recipe);

        return utils.successResponse(result);
    } catch (e) {
        return utils.errorResponse.internalErrorResponse(e.message, { stack: e.stack } );
    }
}


export async function GET(req) {
    return utils.errorResponse.internalErrorResponse("GET method is not supported for this endpoint.");
}