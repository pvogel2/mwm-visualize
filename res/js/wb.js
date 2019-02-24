var wb = {
  setData: json => {
    wb.data = json;
    wb.map = {};
    wb.data.forEach(item => {
      //wb.map[item.ISO3136.toLowerCase()] = item;
      wb.map[item.iso2Code.toLowerCase()] = item;
    });
  },
  loadPopulation: () => fetch('/data/wbv2/country/;/indocators/SP.POP.TOTL/'),
  loadRefugees: () => fetch('/data/wbv2/country/;/indocators/SM.POP.REFG/'),
  loadRefugeesOrigin: () => fetch('/data/wbv2/country/;/indocators/SM.POP.REFG.OR/'),
  getCountry: index => wb.data[index]
};
