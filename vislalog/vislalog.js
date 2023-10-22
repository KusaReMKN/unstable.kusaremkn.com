'use strict';

/**
 * 全ホストの load average 情報を取得する
 *
 * @param { string | URL } url - lalog の URL
 * @param { string | undefined } search - lalog に渡す search パラメータ
 * @returns { [key: string]: { datetime: string, loadavg: number[3] }[] }
 *      - 全てのホストの load average 情報
 */
async function
getLoadAvgs(url, search)
{
    const hosts = await fetch(url).then(res => res.json()).then(obj => obj.hosts);
    const hostUrls = hosts.map(host => {
        const hostUrl = new URL(host, url);
        hostUrl.search = search;
        return hostUrl.toString();
    });
    const fetching = hostUrls.map(url => fetch(url).then(res => res.json()));
    const data = await Promise.all(fetching);
    const result = {};
    Object.assign(result, ...data);
    return result;
}

/**
 * 全ホストの load average を一括表示する
 *
 * @param { HTMLCanvasElement } canvas - 表示に用いる canvas 要素
 * @param { { [key: string]: { datetime: string, loadavg: number[3] }[] }
 *      - 全ホストの load average 情報
 * @returns 生成された chart インスタンス
 */
function
drawAllChart(canvas, loadavgs)
{
    const datasets = Object.keys(loadavgs).reduce((ds, key) => {
        const loadavg = loadavgs[key];
        const dataset = {
            label: key,
            data: loadavg.map(row => ({
                x: new Date(Date.UTC(...row.datetime.split(/[-: ]/))),
                y: row.loadavg[0],
            })),
        };
        ds.push(dataset);
        return ds;
    }, []);
    return new Chart(canvas, {
        type: 'scatter',
        data: { datasets },
        options: {
            showLine: true,
            scales: { x: { type: 'time' }, },
        },
    });
}

/**
 * 各ホストの load average をそれぞれ表示する
 *
 * @param { Element } container - それぞれのグラフを格納する親要素
 * @param { { [key: string]: { datetime: string, loadavg: number[3] }[] }
 *      - 全ホストの load average 情報
 * @returns 生成された chart インスタンスの配列
 */
function
drawEachChart(container, loadavgs)
{
    return Object.keys(loadavgs).map(key => {
        const loadavg = loadavgs[key];
        const datasets = [];
        for (let i = 0; i < 3; i++) {
            datasets.push({
                label: `(${[ '1', '5', '15' ][i]})`,
                data: loadavg.map(row => ({
                    x: new Date(Date.UTC(...row.datetime.split(/[-: ]/))),
                    y: row.loadavg[i],
                })),
            });
        }

        const section = document.createElement('section');
        const h3 = document.createElement('h3');
        h3.textContent = key;
        const canvas = document.createElement('canvas');
        canvas.setAttribute('role', 'img');
        canvas.setAttribute('area-label', `Load average of ${key}`);
        section.append(h3, canvas);
        container.append(section);
        return new Chart(canvas, {
            type: 'scatter',
            data: { datasets },
            options: {
                showLine: true,
                scales: { x: { type: 'time' }, },
            },
        });
    });
}

async function
main()
{
    const url = 'https://unstable.kusaremkn.com/lalog/';
    const search = window.location.search;
    const loadavgs = await getLoadAvgs(url, search);
    drawAllChart(allChart, loadavgs);
    drawEachChart(each, loadavgs);
}

main();
/* ex: se et ts=4 : */
