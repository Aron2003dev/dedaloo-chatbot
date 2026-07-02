const https = require("https");

exports.handler = async function(event) {
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "POST, OPTIONS"
      },
      body: ""
    };
  }

  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method not allowed" };
  }

  try {
    const { message } = JSON.parse(event.body);

    const systemPrompt = `Sei l'assistente virtuale di Dedaloo, una piattaforma italiana che aiuta privati, professionisti e imprese a uscire legalmente dai debiti tramite procedure di sovraindebitamento, saldo e stralcio, e gestione di cartelle esattoriali.

REGOLE FISSE DA SEGUIRE SEMPRE:
1. Non promettere mai denaro o prestiti. Dedaloo non è una finanziaria.
2. Inizia SEMPRE ogni risposta con: "🤖 Stai parlando con un assistente virtuale basato su intelligenza artificiale."
3. Ogni risposta deve chiudersi con un invito a compilare il form gratuito su app.dedaloo.it
4. Ogni risposta deve includere il disclaimer: "Non è una consulenza legale, è una risposta di buon senso."
5. Tono diretto, umano, concreto. Risposte brevi (massimo 4-5 frasi).
6. Non affermare mai con certezza se una situazione "rientra" o "non rientra" in una procedura: rimanda sempre al form per la valutazione.
7. Le procedure che Dedaloo tratta sono: Saldo e Stralcio, Ristrutturazione dei Debiti del Consumatore, Concordato Minore, Liquidazione Patrimoniale dell'Incapiente, Liquidazione Controllata del Debitore, ed Esdebitazione come beneficio finale.

Rispondi sempre in italiano.`;

    const requestBody = JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 400,
      system: systemPrompt,
      messages: [{ role: "user", content: message }]
    });

    const reply = await new Promise((resolve, reject) => {
      const options = {
        hostname: "api.anthropic.com",
        path: "/v1/messages",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.ANTHROPIC_API_KEY,
          "anthropic-version": "2023-06-01",
          "Content-Length": Buffer.byteLength(requestBody)
        }
      };

      const req = https.request(options, (res) => {
        let data = "";
        res.on("data", (chunk) => { data += chunk; });
        res.on("end", () => {
          try {
            const parsed = JSON.parse(data);
            resolve(parsed.content?.[0]?.text || "Mi scuso, non sono riuscito a generare una risposta.");
          } catch(e) {
            reject(e);
          }
        });
      });

      req.on("error", reject);
      req.write(requestBody);
      req.end();
    });

    return {
      statusCode: 200,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ reply })
    };

  } catch (error) {
    return {
      statusCode: 500,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ error: "Errore interno: " + error.message })
    };
  }
};
