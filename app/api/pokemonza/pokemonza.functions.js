import solver from "javascript-lp-solver";

class BerryDonutOptimizer {
    constructor(data) {
        this.berryData = data;
    }

    solve(req) {
        const totalCount = req.limits?.count || 8;
        const RANK_THRESHOLD = 35;
        
        // // [TODO] ここから変更
        const REPEAT_PENALTY = 1000000; 
        const STEP_PENALTY = 1000;      

        const filteredBerries = this.berryData.filter(berry => 
            req.limits?.berries?.[berry.id] !== 0
        );

        const model = {
            "optimize": "score",
            "opType": "min",
            "constraints": {
                "count": { "equal": totalCount }
            },
            "variables": {},
            "ints": {}
        };

        const statusKeys = ["sweet", "sour", "spicy", "bitter", "fresh", "flavor_rank"];
        statusKeys.forEach(s => {
            if (req[s] !== undefined || req.limits?.status_cap?.[s] !== undefined) {
                model.constraints[s] = {};
                if (req[s]) model.constraints[s].min = req[s];
                if (req.limits?.status_cap?.[s]) model.constraints[s].max = req.limits.status_cap[s];
            }
        });

        filteredBerries.forEach(berry => {
            const id = String(berry.id);
            const limitVal = req.limits?.berries?.[id] ?? totalCount;

            // ランク35以下のきのみ
            if (berry.flavor_rank <= RANK_THRESHOLD) {
                const vKey = `x${id}`;
                model.variables[vKey] = {
                    [vKey]: 1, // 制約と紐付け
                    "score": berry.flavor_rank,
                    "count": 1,
                    "sweet": berry.sweet, "sour": berry.sour, "spicy": berry.spicy,
                    "bitter": berry.bitter, "fresh": berry.fresh, "flavor_rank": berry.flavor_rank
                };
                model.constraints[vKey] = { "max": limitVal };
                model.ints[vKey] = 1;
            } 
            // ランク35超のきのみ
            else {
                for (let n = 1; n <= limitVal; n++) {
                    const vKey = `x${id}_n${n}`;
                    model.variables[vKey] = {
                        [vKey]: 1, // 制約と紐付け（これで1個までになる）
                        "score": berry.flavor_rank + (n > 1 ? REPEAT_PENALTY + (n - 2) * STEP_PENALTY : 0),
                        "count": 1,
                        "sweet": berry.sweet, "sour": berry.sour, "spicy": berry.spicy,
                        "bitter": berry.bitter, "fresh": berry.fresh, "flavor_rank": berry.flavor_rank
                    };
                    model.constraints[vKey] = { "max": 1 }; 
                    model.ints[vKey] = 1;
                }
            }
        });
        // // [TODO] ここまで変更

        const result = solver.Solve(model);
        return this._formatResult(result);
    }

    _formatResult(result) {
        if (!result.feasible) return { success: false, message: "条件を満たす組み合わせが見つかりませんでした。" };

        const selectedBerriesMap = new Map();
        let totalRank = 0;
        const totalStats = { sweet: 0, sour: 0, spicy: 0, bitter: 0, fresh: 0, flavor_rank: 0 };

        // // [TODO] ここから変更
        for (const [key, value] of Object.entries(result)) {
            // 変数名 (x54_n1 または x33) から ID を抽出
            if (key.startsWith("x") && value > 0) {
                // key が "x54_n1" なら split('_')[0] で "x54"、slice(1) で "54"
                const id = key.split('_')[0].slice(1);
                const count = Math.round(value);
                
                if (selectedBerriesMap.has(id)) {
                    selectedBerriesMap.get(id).count += count;
                } else {
                    const berry = this.berryData.find(b => String(b.id) === id);
                    if (!berry) continue; // scoreや余計なキーを弾く
                    
                    selectedBerriesMap.set(id, {
                        id: berry.id,
                        name: berry.name,
                        count: count,
                        flavor_rank: berry.flavor_rank
                    });
                }
            }
        }

        // 最終的な集計（実データを使用）
        for (const item of selectedBerriesMap.values()) {
            const berry = this.berryData.find(b => String(b.id) === String(item.id));
            totalRank += berry.flavor_rank * item.count;
            Object.keys(totalStats).forEach(stat => {
                totalStats[stat] += (berry[stat] || 0) * item.count;
            });
        }
        // // [TODO] ここまで変更

        return {
            success: true,
            total_flavor_rank: totalRank,
            total_stats: totalStats,
            unique_types: selectedBerriesMap.size,
            details: Array.from(selectedBerriesMap.values())
        };
    }
}

export { BerryDonutOptimizer };