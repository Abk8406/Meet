
let wrods = "AABBCCDDD";

function print(list){
    let allData ="";
    
     for(let i =0; i < list.length -1; i++){
          let wd = "";
           for(let j=0 ; j<list.length -i-1; j ++){
                  wd += list[i];

           }
          allData += wd 
     }
    return allData;
   
}