const fs = require("fs");
const path = require("path");

function parseCSVLine(line) {
    const result = [];
    let cur = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
        const c = line[i];
        if (c === '"') {
            inQuotes = !inQuotes;
        } else if (c === ',' && !inQuotes) {
            result.push(cur.trim());
            cur = "";
        } else {
            cur += c;
        }
    }
    result.push(cur.trim());
    return result;
}

const csvPath = path.join(__dirname, "../../used_cars_data.csv");
const lines = fs.readFileSync(csvPath, "utf8").split(/\r?\n/);
const map = new Map();

for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const cols = parseCSVLine(line);
    if (cols.length < 12) continue;

    const name = cols[1];
    const fuelType = cols[5];
    const mileageStr = cols[8];
    const seatsStr = cols[11];

    if (!name || map.has(name)) continue;

    let mileage = parseFloat(mileageStr);
    if (isNaN(mileage) || mileage <= 0) mileage = 16.0;

    let seats = parseInt(seatsStr);
    if (isNaN(seats) || seats < 2 || seats > 10) seats = 4;

    // Standardized consumption ratio (15 km/l benchmark)
    const ratio = parseFloat((15.0 / mileage).toFixed(2));

    map.set(name, {
        name,
        fuel_type: fuelType || "Petrol",
        seats,
        mileage_kmpl: mileage,
        fuel_consumption_ratio: Math.max(0.5, Math.min(2.5, ratio))
    });
}

const catalog = Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
const outPath = path.join(__dirname, "../../react-frontend/src/data/vehicle_catalog.json");
fs.writeFileSync(outPath, JSON.stringify(catalog, null, 2), "utf8");

// Also update car_models.json to match unique names
const modelsPath = path.join(__dirname, "../../react-frontend/src/data/car_models.json");
fs.writeFileSync(modelsPath, JSON.stringify(catalog.map(c => c.name), null, 2), "utf8");

console.log(`Successfully processed ${catalog.length} vehicles into catalog!`);

