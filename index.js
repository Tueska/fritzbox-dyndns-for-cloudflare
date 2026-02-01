import express from 'express';
import cors from 'cors';

// --- Routes ---
const app = express();
app.use(cors());
app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`);
    next();
});

app.get('/updateDNS', async (req, res) => {
    updateDNS(req, res);
});

app.post('/updateDNS', async (req, res) => {
    updateDNS(req, res);
});

app.patch('/updateDNS', async (req, res) => {
    updateDNS(req, res);
});

app.put('/updateDNS', async (req, res) => {
    updateDNS(req, res);
});

async function updateDNS(req, res) {
    // Get Zone ID from Cloudflare API using domain name
    const ZONEID = await getZoneID(req.query.token, req.query.domain);
    if (ZONEID === null) {
        res.send('Cloudflare API error');
        console.log('Cloudflare API error, one of the query parameters is wrong');
        return;
    }

    // Get DNS record ID from Cloudflare API using Zone ID and domain name
    const RECORDIDS = await getRecordID(req.query.token, ZONEID, req.query.domain);

    let proxy = false;
    if (req.query.username) {
        proxy = req.query.username.toLowerCase() === 'proxy' ? true : false;
    }

    createZoneRecord(req.query.token, ZONEID, RECORDIDS, req.query.ipaddr, req.query.ip6prefix, req.query.ip6intid, req.query.domain, proxy);

    res.send('');
}

async function getZoneID(token, domain) {
    // Get Zone ID from Cloudflare API using domain name
    let result = await fetch('https://api.cloudflare.com/client/v4/zones', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        }
    })

    result = await result.json();
    if (result.success === false) return null;

    // turn domain into tld
    domain = domain.split('.').slice(-2).join('.');

    // filter result for domain name
    const entry = result.result.find(entry => entry.name === domain);
    return entry ? entry.id : null;
}

async function getRecordID(token, zoneid, domain) {
    let result = await fetch(`https://api.cloudflare.com/client/v4/zones/${zoneid}/dns_records`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        }
    })

    result = await result.json();

    // find multiple entries and save them to a dict with key = type, key being either A or AAAA
    // const entries = result.result.filter(entry => entry.name === domain);
    const entries = result.result.reduce((dict, entry) => {
        if (entry.name === domain) {
            dict[entry.type] = entry.id;
        }
        return dict;
    }, {});

    // check if keys A and AAAA are present, if one is missing add with value null
    if (!entries.hasOwnProperty('A')) entries['A'] = null;
    if (!entries.hasOwnProperty('AAAA')) entries['AAAA'] = null;

    return entries ? entries : null;
}

async function createZoneRecord(token, zoneid, recordid, ipaddr, ip6addr, ip6intid, domain, proxy) {
    // loop over recordid and create/update records
    // log all parameters in console
    let prefix = ip6addr.replace(/::\/\d+$/, ':');
    for (const [type, id] of Object.entries(recordid)) {
        if (ipaddr === undefined && type === 'A') continue;
        if (ip6addr === undefined && type === 'AAAA') continue;
        let recordidSlug = id ? `/${id}` : '';
        let method = id ? 'PATCH' : 'POST';

        let result = await fetch(`https://api.cloudflare.com/client/v4/zones/${zoneid}/dns_records${recordidSlug}`, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                type: type,
                name: domain,
                proxied: proxy,
                comment: 'Updated by DynDNS',
                content: type === 'A' ? ipaddr : prefix + ip6intid,
            })
        })

        result = await result.json();
        if (result.success === false) {
            result.errors.forEach(error => {
                console.log(`Cloudflare API error: ${error.message}`);
            });
        } else {
            console.log(`Set ${result.result.name} to ${result.result.content} - ${result.result.proxied ? 'proxied' : 'not proxied'}`);
        }
    }
}

const PORT = process.env.PORT || 3080;
app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});