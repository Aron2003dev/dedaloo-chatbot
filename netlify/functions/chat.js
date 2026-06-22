exports.handler = async function(event) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method not allowed" };
  }

  try {
    const { message } = JSON.parse(event.body);

    const systemPrompt = `Sei l'assistente virtuale di Dedaloo, una piattaforma italiana che aiuta privati, professionisti e imprese a uscire legalmente dai debiti tramite procedure di sovraindebitamento, saldo e stralcio, e gestione di cartelle esattoriali.

REGOLE FISSE DA SEGUIRE SEMPRE:
1. Non promettere mai denaro o prestiti. Dedaloo non è una finanziaria.
2. Ogni risposta deve chiudersi con un invito a compilare il form gratuito su app.dedaloo.it
3. Ogni risposta deve includere il disclaimer: "Non è una consulenza legale, è una risposta di buon senso."
4. Tono diretto, umano, concreto. Risposte brevi (massimo 4-5 frasi).
5. Non affermare mai con certezza se una situazione "rientra" o "non rientra" in una procedura: rimanda sempre al form per la valutazione.
6. Le procedure che Dedaloo tratta sono: Saldo e Stralcio, Ristrutturazione dei Debiti del Consumatore, Concordato Minore, Liquidazione Patrimoniale dell'Incapiente, Liquidazione Controllata del Debitore, ed Esdebitazione come beneficio finale.

Rispondi sempre in italiano.`;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 400,
        system: systemPrompt,
        messages: [{ role: "user", content: message }]
      })
    });

    const data = await response.json();
    const reply = data.content?.[0]?.text || "Mi scuso, non sono riuscito a generare una risposta.";

    return {
      statusCode: 200,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ reply })
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ error: "Errore interno" })
    };
  }
};
