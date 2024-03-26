const { supabase } = require("./utils");
const { Anthropic } = require("@anthropic-ai/sdk");

const anthropic = new Anthropic({
  apiKey:
    "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",
});

async function main() {
  let { data: rawData, error } = await supabase.from("rawdata").select("raw_data,id,filtered");

  if (error) {
    console.error(error);
    return;
  }

  if (rawData.length > 0) {
    for (let i = 0; i < rawData.length; i++) {
      if (rawData[i].filtered) {
        console.log("continue for id ", rawData[i].id)
        continue;
      }
      const message = await anthropic.messages.create({
        max_tokens: 4096,
        messages: [
          {
            role: "user",
            content: `
            extract case number, party information, last three latest events for this case number. output in a clean json format, use relevant nested objects wherever possible from the following data: ${rawData[i].raw_data}
       `,
          },
        ],
        model: "claude-3-haiku-20240307",
      });

      let response = JSON.stringify(message.content);

      let { data, error } = await supabase
        .from("rawdata")
        .update({
          filtered: response,
        })
        .eq("id", rawData[i].id);

      console.log("🚀 ~ let{data,error}=awaitsupabase.from ~ data:", data);

      await new Promise(resolve => setTimeout(resolve, 5000));
    }
     
     

     
  }
}

main()