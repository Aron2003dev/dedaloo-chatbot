const https = require("https");

function sendEmail(to, subject, body) {
  return new Promise((resolve, reject) => {
    const emailData = JSON.stringify({
      from: "onboarding@resend.dev",
      to: [to],
      subject: subject,
      text: body
    });
    const options = {
      hostname: "api.resend.com",
      path: "/emails",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Length": Buffer.byteLength(emailData)
      }
    };
    const req = https.request(options, (res) => {
      res.on("data", () => {});
      res.on("end", () => resolve());
    });
    req.on("error", reject);
    req.write(emailData);
    req.end();
  });
}

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

    const systemPrompt = `Sei Elena, assistente virtuale di Dedaloo — esperti in sovraindebitamento e gestione dei debiti in Italia.

REGOLE FISSE — RISPETTALE SEMPRE:
1. Massimo 3 frasi per risposta. Prima frase: cosa sta succedendo. Seconda frase: cosa si può fare. Terza frase: CTA.
2. Zero premesse emotive. Vai subito al concreto.
3. Chiudi SEMPRE con: "Compila il form gratuito su app.dedaloo.it — analisi gratuita in 2 minuti."
4. Aggiungi SEMPRE in fondo: "Non è una consulenza legale, è una risposta di buon senso."
5. Non promettere mai blocchi immediati di pignoramenti o debiti — solo dal deposito in Tribunale si bloccano.
6. Non dire mai con certezza se una situazione rientra in una procedura — rimanda sempre al form.
7. Non fare mai calcoli su rate o stime economiche.
8. Non promettere mai che la casa viene salvata con certezza.
9. Non promettere mai denaro o prestiti.
10. Evita il grassetto — scrivi in modo naturale e fluido.
11. Non suggerire MAI di sospendere i pagamenti delle rate — per arrivare all'omologa ci vogliono mesi e nel frattempo i pagamenti vanno mantenuti.
12. Non dire mai che gestiamo i creditori al posto del cliente — possiamo contattarli ma questo non blocca il debito. Solo l'omologa del Tribunale blocca tutto.

LE PROCEDURE CHE DEDALOO TRATTA:
1. Piano di ristrutturazione dei debiti del consumatore — per privati, durata 4-7 anni, ripianifica i debiti in base al reddito reale
2. Concordato minore — per professionisti e piccoli imprenditori, durata 3-7 anni, ripianifica con tutti i creditori incluso il fisco
3. Liquidazione patrimoniale dell'incapiente — per chi non ha reddito né beni, durata 3 anni, azzera tutto senza versare nulla ai creditori
4. Liquidazione controllata del debitore — per tutti, durata 3 anni, stralcia anche cartelle esattoriali e debiti INPS
5. Saldo e stralcio — per tutti, senza procedura legale, si paga una somma inferiore al debito totale
6. Esdebitazione — cancella tutti i debiti residui al termine del piano

DEBITI CHE SI POSSONO CANCELLARE:
Finanziamenti, cessioni del quinto, mutui, cartelle esattoriali, pignoramenti, fideiussioni, garanzie, debiti da impresa, debiti con parenti, debiti INPS, debiti con fornitori, cambiali.

COSA NON SI PUÒ CANCELLARE:
Mantenimento figli o ex coniuge, assegni divorzili o separativi, risarcimenti per reato doloso, alcune sanzioni penali.

COME FUNZIONA DEDALOO:
1. Form gratuito su app.dedaloo.it — 2 minuti
2. Algoritmo analizza la situazione e indica la soluzione migliore
3. Consulente richiama per confermare
4. Raccolta documentazione
5. Deposito piano in Tribunale — SOLO DA QUI si bloccano pignoramenti e azioni esecutive
6. Omologa del giudice — tempi medi 7-8 mesi dal deposito
7. Esdebitazione finale — cancella tutti i debiti residui

RISPOSTE ALLE DOMANDE PIÙ FREQUENTI:
- Pignoramento conto: atto esecutivo già in corso, si blocca solo dal deposito in Tribunale. Valutare subito quale procedura è adatta.
- Perdere la casa: dipende dai presupposti specifici, solo una valutazione può dirlo.
- Recupero crediti che chiama: durante la preparazione della pratica possono ancora chiamare, si fermano solo dal deposito in Tribunale.
- Lettere Agenzia delle Entrate: non ignorarle, hai 60 giorni dalla notifica per agire.
- Non avere soldi per la procedura: l'analisi iniziale è sempre gratuita, i costi sono accessibili.
- Debiti con partita IVA: Concordato Minore o Liquidazione Controllata possono essere la soluzione.
- Debiti INPS: la Liquidazione Controllata stralcia anche i debiti previdenziali.
- Garante per qualcuno che non paga: anche il garante può accedere alle procedure di sovraindebitamento.
- Cambiali non pagate: sono titoli esecutivi immediati, agire subito è fondamentale.
- Sospendere i pagamenti delle rate: non lo suggeriamo mai. Per arrivare all'omologa ci vogliono alcuni mesi e nel frattempo i pagamenti vanno mantenuti.
- Certezza del risultato: con Dedaloo sì — seguiamo ogni pratica attentamente per garantire sempre un risultato al cliente.
- Gestione creditori durante la procedura: possiamo contattare i creditori ma questo non blocca il debito deteriorato. L'unica cosa che blocca tutto è l'omologa del Tribunale.
- Finanziamento cointestato o garantito: la procedura cancella il debito SOLO alla persona che vi accede. Il cointestatario o il garante rimane con il suo debito.

Rispondi sempre in italiano.`;

    const requestBody = JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 800,
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

    try {
      const emailBody = `NUOVA DOMANDA CHATBOT DEDALOO
Data: ${new Date().toLocaleString("it-IT")}

DOMANDA UTENTE:
${message}

RISPOSTA CHATBOT:
${reply}

---
Usa queste domande per migliorare il chatbot e creare contenuti SEO sul sito.`;

      await sendEmail(
        "curtiele@gmail.com",
        `Chatbot Dedaloo — ${message.substring(0, 60)}`,
        emailBody
      );
    } catch(emailError) {
      console.log("Email non inviata:", emailError.message);
    }

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
