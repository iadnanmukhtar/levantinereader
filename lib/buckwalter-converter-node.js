var bw2araMap = {
    "A": "ا",
    "b": "ب",
    "t": "ت",
    "v": "ث",
    "j": "ج",
    "H": "ح",
    "x": "خ",
    "d": "د",
    "*": "ذ",
    "r": "ر",
    "z": "ز",
    "s": "س",
    "$": "ش",
    "S": "ص",
    "D": "ض",
    "T": "ط",
    "Z": "ظ",
    "E": "ع",
    "g": "غ",
    "f": "ف",
    "q": "ق",
    "k": "ك",
    "l": "ل",
    "m": "م",
    "n": "ن",
    "h": "ه",
    "w": "و",
    "y": "ي",
    "p": "ة", //teh marbuta

    "a": '\u064E', // fatha
    "u": '\u064f', // damma
    "i": '\u0650', // kasra
    "F": '\u064B', // fathatayn
    "N": '\u064C', // dammatayn
    "K": '\u064D', // kasratayn
    "~": '\u0651', // shadda
    "o": '\u0652', // sukun

    "'": '\u0621', // lone hamza
    ">": '\u0623', // hamza on alif
    "<": '\u0625', // hamza below alif
    "&": '\u0624', // hamza on wa
    "}": '\u0626', // hamza on ya

    "|": '\u0622', // madda on alif
    "{": '\u0671', // alif al-wasla
    "`": '\u0670', // dagger alif
    "Y": '\u0649', // alif maqsura

    "[": "[",
    "]": "]",

};

function makeAra2bwMap() {
    var map = {};
    for (var k in bw2araMap) {
        map[bw2araMap[k]] = k;
    }
    return map;
}
var ara2bwMap = makeAra2bwMap();

function bw2arab(bw) {
    var aras = bw.trim().split("").map(function (sym) {
        var ara = bw2araMap[sym];
        if (sym.length > 0 && ara === undefined || ara === null) {
            console.log("No mapping for bw symbol /" + sym + "/");
            return "?";
        } else {
            return ara;
        }
    });
    var res = aras.join("")
    return res;
}

function arab2bw(ara) {
    var bws = ara.trim().split("").map(function (sym) {
        var bw = ara2bwMap[sym];
        if (sym.length > 0 && bw === undefined || bw === null) {
            console.log("No mapping for ara symbol /" + sym + "/");
            return "?";
        } else {
            return bw;
        }
    });
    var res = bws.join("")
    return res;
}

module.exports = {
    bw2arab,
    arab2bw
}