function sortArray(array) {
    return array.sort(function (a, b) {
        return a - b;
    });
}

function quantile(array, p) {
    const pos = (array.length - 1) * p;
    const base = Math.floor(pos);
    const rest = pos - base;
    if (array[base + 1] !== undefined) {
        return array[base] + rest * (array[base + 1] - array[base]);
    } else {
        return array[base];
    }
}

function count(array) {
    const sorted = sortArray(array);
    const q25 = quantile(sorted, 0.25);
    const q75 = quantile(sorted, 0.75);
    const median = quantile(sorted, 0.5);
    const min = sorted[0];
    const max = sorted[sorted.length - 1];
    return [min, max, median, q25, q75];
}

module.exports =  {

    print: function (array) {
        [min, max, median, q25, q75] = count(array);
        let table =
                {
                    ["минимальное время, мс"]: parseFloat(min.toFixed(2)),
                    ["максимальное время, мс"]: parseFloat(max.toFixed(2)),
                    ["I квартиль (25%)"]: parseFloat(q25.toFixed(2)),
                    ["медиана (50%)"]: parseFloat(median.toFixed(2)),
                    ["III квартиль (75%)"]: parseFloat(q75.toFixed(2))
                };
        return table;
    }
};