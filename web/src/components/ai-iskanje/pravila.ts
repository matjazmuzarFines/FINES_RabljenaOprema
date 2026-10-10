// Pravila za AI iskanje: če vprašanje vsebuje ključ (male črke, brez šumnikov ni treba),
// se vprašanju pred iskanjem doda besedilo na desni. Tako model razume interne izraze in kratice.
// Primer: kdo napiše »kombi«, model išče tudi »konvekcijsko-parna peč«.
export const SINONIMI: Record<string, string> = {
  kombi: "konvekcijsko-parna peč",
  // "etažna": "etažna peč za kruh, krušna peč",
  // "hladilnik": "hladilna omara, hladilna komora",
};
