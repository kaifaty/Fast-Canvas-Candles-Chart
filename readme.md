# Fast-Canvas-Candles-Chart

Candels chart for crypto currencies.

Without any dependencies, used ES2016.


Format of candle:

	{"vol": 10.0,

	"high": 687.17138776,

	"low": 666.17876696,

	"date": 1542934800,

	"close": 680.84884551,

	"open": 687.17138776}


# Getting started

1. Create canvas DOM element:

		<canvas id = "canvas"></canvas>

2. Create chart object.

		let chart = new Chart(document.getElementById("canvas"));

3. Update data:

		chart.update(data, ["ETH","STE"]);
		
	before each `chart.update()` put `chart.loading_spinner()` for show loading spinner.
	
	    
