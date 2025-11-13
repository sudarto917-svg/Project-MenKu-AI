// functions/index.js
const functions = require('firebase-functions');
const { GoogleGenAI } = require('@google/genai'); 

// Ambil Secret Key dari Firebase Secret Manager
// PASTIKAN ANDA SUDAH MENJALANKAN PERINTAH: firebase functions:secrets:set GEMINI_API_KEY="..."
const ai = new GoogleGenAI({ 
    apiKey: process.env.GEMINI_API_KEY 
});

exports.getSmartBudgetAdvice = functions
    .region('asia-southeast2') // Pastikan region ini sama dengan di frontend
    .https.onCall(async (data, context) => {

    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Akses ditolak.');
    }

    const { totalIncome, currentBudget } = data;
    
    // Logika Formatting Prompt
    const budgetLines = Object.keys(currentBudget).map(category => {
        return `${category}: Rp ${currentBudget[category].toLocaleString('id-ID')}`;
    }).join('\n');

    // Prompt Detail
    const prompt = `
        Anda adalah analis keuangan keluarga. Saya memiliki total pendapatan bulanan Rp ${totalIncome.toLocaleString('id-ID')}.
        Berikut adalah target anggaran bulanan bulanan saya:
        ${budgetLines}
        
        Tujuan utama kami adalah melunasi utang (Tagihan) yang besar dan membangun tabungan/investasi.
        Berikan 3 saran manajemen keuangan yang spesifik dan praktis. Fokus pada penghematan dan penguatan kategori Tabungan/Investasi.
        Jawab dalam Bahasa Indonesia dan format sebagai list item, dimulai dengan tanda bintang (*).
    `;

    try {
        // Panggilan API AI yang sebenarnya
        const response = await ai.models.generateContent({ 
            model: "gemini-2.5-flash", 
            contents: [{role: "user", parts: [{text: prompt}]}] 
        });
        
        const advice = response.text.trim();
        
        return { success: true, advice: advice };

    } catch (error) {
        console.error("Error calling AI API:", error);
        // Penting: Kembalikan error yang aman
        return { success: false, error: 'Gagal mendapatkan saran dari AI. Cek log Firebase Functions.' };
    }
});
