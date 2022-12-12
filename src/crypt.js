
const N = 10;

function keyTranscript(key, N) { // разбор ключа
  
  let par = key.split(',');
  let P = new Array(5);
  P[0] = Number(par[0]);
  P[1] = Number(par[1]);
  P[2] = Number(par[2]);
  P[3] = Number(par[3]);
  P[4] = Number(par[4]);

  return P;

}

exports.encode = (str, key) => { // кодирование 
  
  let P = new Array(5);
  P = keyTranscript(key,N); // Параметры ключа

  let bitsEncoded = []; // массив зашифрованных битов (частей кода символа)

  for (let i = 0; i < str.length; i++) {
    
    let symbol = str.charCodeAt(i);  // получение кода символа
  
    if (symbol>=1040 && symbol<=1103) { // Сдвиг русских символов до 3-значных чисел
        symbol = symbol-200;
    }
  
    const byte1 = (symbol / 100) >> 0;
    const byte2 = ((symbol % 100) - (symbol % 10)) / 10;
    const byte3 = symbol % 10; // разбиение кода символа на цифры
  
    bitsEncoded.push(byte1);
    bitsEncoded.push(byte2);
    bitsEncoded.push(byte3);

  }
  
  let mass = new Array(2);
  mass[0] = 0;
  mass[1] = 0;
  
  let cliffordMass = [];
  
  for (let i = 0; i < bitsEncoded.length; i++) {
    mass = clifford(mass[0], mass[1], P); // Получение значений генератора
    cliffordMass.push(mass[0] ^ mass[1]); // xor значений
  }

  cliffordMass = clifford_digitalization(cliffordMass, N); // дискретизация

  for (let i=0;i<bitsEncoded.length;i++) {
      bitsEncoded[i] = bitsEncoded[i] + cliffordMass[i]; // наложение шума 
  }
  
  bitsEncoded = bits_digitalization(bitsEncoded, N); // дискретизация

  return bitsEncoded;
  
}

exports.translate = (bits) => { // перевод битов (частей кода символа) в символы
  let result = "";

  for (let i = 0; i < bits.length / 3; i++) {
    result =
      result +
      String.fromCharCode(
        bits[i * 3] * 100 + bits[i * 3 + 1] * 10 + bits[i * 3 + 2]
      );
  }

  return result;
}

exports.decode = (bits, key) => { // декодирование
  
  let P = new Array(5);
  P = keyTranscript(key,N); // получение параметров ключа

  let resultDecoded = "";
  let bitsDecoded = [];

  let mass = new Array(2);
  mass[0] = 0;
  mass[1] = 0;

  let cliffordMass = [];

  for (let i = 0; i < bits.length; i++) {
    mass = clifford(mass[0], mass[1], P); // получение значений генератора
    cliffordMass.push(mass[0] ^ mass[1]); // xor значений
  }

  cliffordMass = clifford_digitalization(cliffordMass, N); // дискретизация

  for (let i=0;i<bits.length;i++) {
      bitsDecoded[i] = bits[i] - cliffordMass[i]; // ликвидация шума
  }

  bitsDecoded = bits_digitalization(bitsDecoded, N); // дискретизация

  for (let i=0; i<bitsDecoded.length;i=i+3)
  {
      let out = bitsDecoded[i]*100 + bitsDecoded[i+1]*10 + bitsDecoded[i+2];
      if (out>=840 && out<=903) { // обратный сдвиг русских символов 
          out = out+200;
      }
      resultDecoded = resultDecoded + String.fromCharCode(out);
  }

  return resultDecoded;

}

function clifford(x, y, P) { // генератор
  let mass = new Array(2);
  mass[0] = (Math.sin(P[0] * y) + P[2] * Math.cos(P[0] * x)) * P[4];
  mass[1] = (Math.sin(P[1] * x) + P[3] * Math.cos(P[1] * y)) * (1 - P[4]);
  return mass;
}

function clifford_digitalization(mass, N) { // дискретизация значений, полученных из генератора
  for (let i = 0; i < mass.length; i++) {
    mass[i] =
      mass[i] <= -N
        ? mass[i] + N * (-(mass[i] / N)^0)
        : mass[i] >= N
        ? mass[i] - N * ((mass[i] / N)^0)
        : mass[i];
  }
  return mass;
}

function bits_digitalization(mass, N) { // дискретизация значений битов
    for (let i = 0; i < mass.length; i++) {
      mass[i] =
        mass[i] < 0
          ? mass[i] + N * ((-(mass[i] / N)^0)+1)
          : mass[i] >= N
          ? mass[i] - N * ((mass[i] / N)^0)
          : mass[i];
    }
    return mass;
}