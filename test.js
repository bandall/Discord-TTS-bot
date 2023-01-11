const parseStringUnder200 = async (interaction, text) => {
    const result = [];
    const splitText = text.split(" ");

    for(let i = 0; i < splitText.length; i++) {
        if(splitText[i].length >= 200) {
            console.log("Word length is over 200");
            return null;
        }
    }

    let tmp = ""
    for(let i = 0; i < splitText.length; i++) {
        if(tmp.length + splitText[i].length >= 190) {
            result.push(tmp);
            tmp = "";
        }
        tmp += (splitText[i] + " ");
    }
    if(tmp != "") result.push(tmp);

    for(let i = 0; i < result.length; i++) {
        if(result[i].length >= 200) {
            console.log("Parse Method Error");
            return null;
        }
    }
    return result;
}
