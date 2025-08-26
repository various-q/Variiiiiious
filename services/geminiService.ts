import { GoogleGenAI, Type } from "@google/genai";
import { Stock, NewsArticle, Sentiment, Recommendation, ScreenerCriteria } from '../types';

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  console.error("API_KEY environment variable not set.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY! });

export const getAIStockAnalysis = async (stock: Stock): Promise<string> => {
  if (!API_KEY) {
    return Promise.resolve("عذرًا، خدمة التحليل بالذكاء الاصطناعي غير متاحة حاليًا.");
  }

  const prompt = `
    أنت محلل مالي خبير ومهمتك هي تقديم تحليل موجز وسهل الفهم لسهم معين للمستثمرين الأفراد باللغة العربية.
    لا تقدم أي نصيحة مالية مباشرة مثل "اشترِ" أو "بع". ركز على شرح المؤشرات بموضوعية.

    بيانات السهم الحالية:
    - اسم السهم: ${stock.name} (${stock.symbol})
    - السعر الحالي: ${stock.price.toFixed(2)} دولار أمريكي
    - التغيير اليومي: ${stock.changePercent.toFixed(2)}%
    - مؤشر القوة النسبية (RSI): ${stock.rsi.toFixed(2)}
    - نطاق 52 أسبوعًا: ${stock.fiftyTwoWeekLow.toFixed(2)} - ${stock.fiftyTwoWeekHigh.toFixed(2)} دولار
    - نسبة السعر إلى القيمة الدفترية (P/B): ${stock.priceToBook.toFixed(2)}

    بناءً على هذه البيانات، قدم تحليلاً من فقرة واحدة (3-4 جمل) يشرح ما قد تعنيه هذه الأرقام.
    ابدأ بشرح معنى قيمة مؤشر القوة النسبية (RSI).
    ثم، علّق على موقع السعر الحالي ضمن نطاق الـ 52 أسبوعًا.
    أخيرًا، اذكر ما قد تشير إليه نسبة السعر إلى القيمة الدفترية (P/B).
    `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    console.error("Error fetching AI analysis:", error);
    return "حدث خطأ أثناء محاولة تحليل السهم. يرجى المحاولة مرة أخرى لاحقًا.";
  }
};

export const getAIStockForecast = async (stock: Stock): Promise<string> => {
    if (!API_KEY) return Promise.resolve("خدمة التوقعات غير متاحة.");
    
    const prompt = `
    أنت محلل مالي متخصص في إدارة المخاطر. بناءً على بيانات السهم التالية لـ ${stock.name} (${stock.symbol}), قدم 3 سيناريوهات محتملة (متفائل، واقعي، متشائم) لأداء السهم على المدى القصير (3-6 أشهر).
    - السعر الحالي: ${stock.price.toFixed(2)}
    - مؤشر القوة النسبية (RSI): ${stock.rsi.toFixed(2)}
    - P/E Ratio: ${stock.priceToEarningsRatio.toFixed(2)}
    - القطاع: ${stock.sector}

    لا تقدم نصائح استثمارية. اذكر العوامل التي قد تؤدي إلى كل سيناريو. كن موجزاً ومنسقاً. استخدم التنسيق التالي:
    **السيناريو المتفائل:** [شرح]
    **السيناريو الواقعي:** [شرح]
    **السيناريو المتشائم:** [شرح]
    `;
    try {
        const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
        return response.text;
    } catch (error) {
        console.error("Error fetching AI forecast:", error);
        return "حدث خطأ أثناء توليد السيناريوهات المستقبلية.";
    }
};

export const getSentimentForNews = async (articles: NewsArticle[]): Promise<NewsArticle[]> => {
    if (!API_KEY || articles.length === 0) return Promise.resolve(articles);

    const headlines = articles.map(a => `(id: ${a.id}) ${a.headline}`).join('\n');
    const prompt = `
    قم بتحليل المشاعر في عناوين الأخبار التالية المتعلقة بالشركة. لكل عنوان، صنف المشاعر كـ 'إيجابي' أو 'سلبي' أو 'محايد'.
    أجب فقط بمصفوفة JSON من الكائنات، حيث يحتوي كل كائن على "id" و "sentiment".
    
    العناوين:
    ${headlines}
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            id: { type: Type.STRING },
                            sentiment: { type: Type.STRING, enum: ['إيجابي', 'سلبي', 'محايد'] }
                        },
                        required: ["id", "sentiment"]
                    }
                }
            }
        });
        // Use a type assertion for robust parsing of the JSON response.
        const results = JSON.parse(response.text) as { id: string; sentiment: Sentiment }[];
        const sentimentMap = new Map(results.map(item => [item.id, item.sentiment]));
        
        return articles.map(article => ({
            ...article,
            sentiment: sentimentMap.get(article.id) || Sentiment.Neutral
        }));
    } catch (error) {
        console.error("Error fetching sentiment analysis:", error);
        // Return articles without sentiment in case of error
        return articles.map(a => ({...a, sentiment: Sentiment.Neutral }));
    }
};


export const getScreenerCriteriaFromQuery = async (query: string): Promise<ScreenerCriteria> => {
    if (!API_KEY) throw new Error("API key is not configured.");

    const prompt = `
    أنت خبير في تحليل بيانات الأسهم ومهمتك هي تحويل استعلامات المستخدم المكتوبة باللغة الطبيعية إلى معايير فلترة بصيغة JSON.
    استخرج معايير الفلترة من الاستعلام التالي: "${query}"

    هذه هي الحقول المتاحة للفلترة ومعانيها المحتملة:
    - sectors (string[]): قطاعات الشركات. (مثال: 'التكنولوجيا', 'الرعاية الصحية', 'الطاقة')
    - rsi (min/max): مؤشر القوة النسبية. "زخم عالي" أو "شراء زائد" يعني rsi > 70. "زخم منخفض" أو "بيع زائد" يعني rsi < 30.
    - priceToEarningsRatio (min/max): نسبة السعر إلى الربحية. "منخفضة" تعني < 15. "مرتفعة" تعني > 35.
    - marketCapInBillions (min/max): القيمة السوقية بالمليار دولار. "شركات كبرى" تعني > 200. "شركات صغيرة" تعني < 2.
    - dividendYield (min/max): عائد التوزيعات (نسبة مئوية). "عائد مرتفع" يعني > 3.
    - recommendation (string[]): التوصية. القيم الممكنة هي: '${Recommendation.StrongBuy}', '${Recommendation.Buy}', '${Recommendation.Hold}', '${Recommendation.Sell}', '${Recommendation.StrongSell}'. (مثال: "أسهم للشراء" يمكن أن تشمل '${Recommendation.StrongBuy}' و '${Recommendation.Buy}')

    أجب فقط بكائن JSON يطابق المخطط المحدد. إذا لم يتمكن من استخلاص أي معايير، أجب بكائن JSON فارغ {}.
    `;

    const responseSchema = {
        type: Type.OBJECT,
        properties: {
            sectors: { type: Type.ARRAY, items: { type: Type.STRING }, nullable: true },
            rsi: { type: Type.OBJECT, properties: { min: { type: Type.NUMBER, nullable: true }, max: { type: Type.NUMBER, nullable: true } }, nullable: true },
            priceToEarningsRatio: { type: Type.OBJECT, properties: { min: { type: Type.NUMBER, nullable: true }, max: { type: Type.NUMBER, nullable: true } }, nullable: true },
            marketCapInBillions: { type: Type.OBJECT, properties: { min: { type: Type.NUMBER, nullable: true }, max: { type: Type.NUMBER, nullable: true } }, nullable: true },
            dividendYield: { type: Type.OBJECT, properties: { min: { type: Type.NUMBER, nullable: true }, max: { type: Type.NUMBER, nullable: true } }, nullable: true },
            recommendation: { type: Type.ARRAY, items: { type: Type.STRING, enum: Object.values(Recommendation) }, nullable: true },
        },
    };

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: responseSchema,
            }
        });
        return JSON.parse(response.text) as ScreenerCriteria;
    } catch (error) {
        console.error("Error parsing AI screener query:", error);
        throw new Error("لم أتمكن من فهم طلبك. يرجى محاولة إعادة صياغته.");
    }
};