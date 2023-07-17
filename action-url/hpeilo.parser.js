var ILOParser = {
	useAjax: true,
	json: [],
	evalSource: '',
	serviceID: -1,
	
	
	registerEventHandlers: function() {
		var navigators = document.getElementsByClassName("navigate");
		for(var i = 0; i < navigators.length; i++) {
			navigators[i].removeEventListener("click", ILOParser.navigateClickHandler);
			navigators[i].addEventListener("click", ILOParser.navigateClickHandler, false);
		}
	},
	documentReadyHandler: function(event) {
		ILOParser.tryParse();
	},
	navigateClickHandler: function(event) {
		var always = function() {
			document.getElementById("loader").style.opacity = 0;
		};
		document.getElementById("loader").style.opacity = 1;
		if(!ILOParser.useAjax)
			return;
		var a = this;
		event.preventDefault();
		var xhr = new XMLHttpRequest();
		xhr.onload = function() {
			if(this.status != 200) {
				window.location.href = a.href;
				always();
				return;
			}
			ILOParser.evalSource = this.responseText;
			ILOParser.tryParse();
			try {
				const url = new URL(a.href);
				document.title = "iLO-q: " + url.searchParams.get('ip');
				window.history.replaceState({}, document.title, a.href);
				
			} catch(e) { console.log(e); }
			always();
		}
		xhr.onerror = function() {
			window.location.href = a.href;
			always();
		}
		xhr.open("GET", a.href + "&putraw=1");
		xhr.send();
	},
	tryParse: function() {
		document.getElementById("viewframe").innerHTML = ILOParser.tryParseInner();
	},
	tryParseInner: function() {
		try {
			eval(ILOParser.evalSource);
			if(typeof(in_viewmenuhosts) != 'undefined')
				document.getElementById("viewmenuhosts").innerHTML = in_viewmenuhosts;
			if(typeof(in_viewmenupages) != 'undefined')
				document.getElementById("viewmenupages").innerHTML = in_viewmenupages;
			if(typeof(in_viewheader) != 'undefined')
				document.getElementById("viewheader").innerHTML = in_viewheader;
			ILOParser.registerEventHandlers();
			
			if(typeof(jData) == 'undefined')
				return "<h2>Failed to parse input data: jData was not correctly defined</h2>";
			if(typeof(serviceID) == 'undefined')
				return "<h2>Failed to parse input data: serviceID was not correctly defined</h2>";
			ILOParser.serviceID = serviceID;
			
			if(jData == "not-allowed")
				return "<h2>You are not allowed to query hosts not in the list on the left.</h2>";
			if (jData == "")
				return "<h2>" + ILOParser.getName() + " Info Data is not available!</h2>";
			ILOParser.json = JSON.parse(jData);
			return ILOParser.getHtml();
		} catch(e) {
			if(e instanceof SyntaxError) {
				return "<h2>Invalid output from backend: " + e.message + "</h2>";
			}
			return "<h2>Error while parsing input data: " + e.message;
		}
	},
	getHtml: function() {
		var html = '';
		switch (ILOParser.serviceID) {
			case 0: html = ILOParser.tables.summary(); break;
			case 1: html = ILOParser.tables.ps(); break;
			case 2: html = ILOParser.tables.fans(); break;
			case 3: html = ILOParser.tables.temp(); break;
			case 4: html = ILOParser.tables.storage(); break;
			case 5: html = ILOParser.tables.memory(); break;
			case 6: html = ILOParser.tables.cpu(); break;
			case 7: html = ILOParser.tables.network(); break;
			default: html = "<h1>Something went terribly wrong (Invalid service ID)...</h1>";
		}
		return '<br /><br />' + html + '<br /><br />';
	},
	getName: function() {
		switch (ILOParser.serviceID) {
			case 0: return "Health Summary";
			case 1: return "Power Supply";
			case 2: return "Fault Tolerant Fans";
			case 3: return "Temperature Sensors";
			case 4: return "Storage Controller";
			case 5: return "Memory Summary";
			case 6: return "CPU Summary";
			case 7: return "Network Summary";
			default: return "Unknown";
		}
	},
	tables: {
		summary: function() {
			var json = ILOParser.json || [];
			var html = '<table id="t01" border="3" align="center">' +
			'<caption>' + ILOParser.getName() + '</caption>' +
			'<tr></tr><tr><th style="width: 250px;">' + 'Field' + '</th><th>' + 'Value' + '</th></tr>';
			for(var j in json){
				//console.log(j, json[j]);
				var str = json[j].toLowerCase();
				var str_class="";
				if(str.includes("failed"))
					str_class = "bErr";
				else if(str.includes("degraded"))
					str_class = "bWarn";
				else if(str.includes("ok"))
					str_class = "bOk";
				html += '<tr><td data-id="' + j + '">' + ILOParser.helpers.summaryFieldname(j) + '</td><td class="' + str_class + '">' + json[j] + '</td></tr>';
			}
			html += '</table>';
			return html;
		},
		ps: function() {
			var json = ILOParser.json || [];
			var html = '<table id="t01" border="3" align="center">' +
				'<caption>' + ILOParser.getName() + '</caption>' +
			'</table>';
			for(var j in json){
				html += '<br /><br />' +
				'<table border="3" align="center"' +
					'<tr><th style="width:200px;">' + "Power Supply Bay" + '</th><td>' + j + '</td></tr>' +
					'<tr><th>' + "Status" + '</th><td>' + ILOParser.helpers.statePresence(json[j].Present) + '</td></tr>' +
					'<tr><th>' + "Condition " + '</th><td>' + ILOParser.helpers.stateCondition(json[j].Condition) + '</td></tr>' +
					'<tr><th>' + "Model" + '</th><td>' + ILOParser.helpers.isUndefined(json[j].Model) + '</td></tr>' +
					'<tr><th>' + "Serial Number" + '</th><td>' + ILOParser.helpers.isUndefined(json[j].SerialNumber) + '</td></tr>' +
					'<tr><th>' + "Spare Part Number" + '</th><td>' + ILOParser.helpers.isUndefined(json[j].SparePartNum) + '</td></tr>' +
					'<tr><th>' + "Main Voltage" + '</th><td>' + ILOParser.helpers.isUndefined(json[j].MainVoltage) + " Volt" + '</td></tr>' +
					'<tr><th>' + "Maximum Capacity" + '</th><td>' + ILOParser.helpers.isUndefined(json[j].CapacityMaximum) +" Watt" +'</td></tr>' +
					'<tr><th>' + "Firmware Revision" + '</th><td>' + ILOParser.helpers.isUndefined(json[j].FirmwareRev) + '</td></tr>' +
				'</table>';
			}
			return html;
		},
		fans: function() {
			var json = ILOParser.json || [];
			var html = '<table id="t01" border="3" align="center">' +
			'<caption>' + ILOParser.getName() + '</caption>' +
			'<tr></tr><tr><th>' + 'Fan' + '</th><th>' + 'Location' + '</th><th>' + 'Type' + '</th><th>' + 'Present' + '</th><th>' + 'HotPluggable' + '</th><th>' + 'Speed' + '</th><th>' + 'Redundancy state' + '</th></tr>';
			for(var j in json) {
				if(typeof(json[j].FanIndex) != 'undefined')
					html += '<tr>' +
						'<td>' + json[j].FanIndex + '</td>' +
						'<td>' + ILOParser.helpers.fanLocation(json[j].FanLocale)   + '</td>' +
						'<td>' + ILOParser.helpers.fanType(json[j].FanType) + '</td>' +
						'<td>' + ILOParser.helpers.statePresence(json[j].FanPresent) + '</td>' +
						'<td>' + ILOParser.helpers.fanPlug(json[j].FanHotPlug) + '</td>' +
						'<td>' + ILOParser.helpers.fanSpd(json[j].FanSpeed) + '</td>' +
						'<td>' +  ILOParser.helpers.fanRedundancy(json[j].FanRedundant) + '</td>' +
					'</tr>';
			}
			html += '</table>';
			return html;
		},
		temp: function() {
			var json = ILOParser.json || [];
			var html = '<table id="t01" border="3" align="center">' +
			'<caption>' + ILOParser.getName() + '</caption>' +
			'<tr></tr><tr><th>' + 'Sensor' + '</th><th>' + 'Location'   + '</th><th>' + 'Temperature' + '</th><th>' + 'Threshold' +	'</th><th>' + 'Sensor Condition' +	'</th><th>' + 'Reaction Type' + '</th></tr>';
			for(var j in json) {
				if(typeof(json[j].TmpInd) != 'undefined')
					html += '<tr>' +
						'<td>' + json[j].TmpInd + '</td>' +
						'<td>' + ILOParser.helpers.tempLocation(json[j].TmpLocale)   + '</td>' +
						'<td>' + ILOParser.helpers.isUndefined(json[j].TmpCelsius) + '</td>' +
						'<td>' + ILOParser.helpers.isUndefined(json[j].TmpThres) + '</td>' +
						'<td>' + ILOParser.helpers.tempCondition(json[j].TmpCond) + '</td>' +
						'<td>' + ILOParser.helpers.tempThresholdType(json[j].TmpThresType) + '</td>' +
					'</tr>';
			}
			html += '</table>';
			return html;
		},
		storage: function() {
			var json = ILOParser.json || [];
			var html = '<table id="t01" border="3" align="center">' +
				'<caption>' + ILOParser.getName() + '</caption>' +
			'</table>';
			for(var j in json){
				html += '<br /><br />' +
				'<table border="3" align="center"' +
					'<tr><th style="width:200px;">' + "Model" + '</th><td>' + ILOParser.helpers.storageControllerModel(json[j].st_Model) + '</td></tr>' +
					'<tr><th>' + "Firmware version" + '</th><td>' + ILOParser.helpers.isUndefined(json[j].st_FWRev) + '</td></tr>' +
					'<tr><th>' + "Controller Condition " + '</th><td>' + ILOParser.helpers.stateCondition(json[j].st_Cond) + '</td></tr>' +
					'<tr><th>' + "Product Revision" + '</th><td>' + ILOParser.helpers.isUndefined(json[j].st_Prod_Rev) + '</td></tr>' +
					'<tr><th>' + "Serial Number" + '</th><td>' + ILOParser.helpers.isUndefined(json[j].st_SerlNum) + '</td></tr>' +
					'<tr><th>' + "Rebuild Priority" + '</th><td>' + ILOParser.helpers.storageControllerRebuildPrio(json[j].st_RebuildPriority) + '</td></tr>' +
					'<tr><th>' + "Internal Ports" + '</th><td>' + ILOParser.helpers.isUndefined(json[j].st_NumOfInt_Ports) + '</td></tr>' +
					'<tr><th>' + "Current Temperature" + '</th><td>' + ILOParser.helpers.storageControllerTemp(json[j].st_Cur_Temp) + '</td></tr>' +
				'</table>';
			}
			return html;
		},
		memory: function() {
			var json = ILOParser.json || [];
			var html = '<table id="t01" border="3" align="center">' +
			'<caption>' + ILOParser.getName() + '</caption>' +
			'<tr></tr><tr><th>' + 'Location' + '</th><th>' + 'Status' + '</th><th>' + 'Present' + '</th><th>' + 'Locked' + '</th><th>' + 'Hot Plug' + '</th><th>' + 'Total Memory' + '</th><th>' +  'In Use by OS' +  '</th><th>' +  'Op Frequency' +  '</th><th>' +  'Op Voltage' + '</th></tr>';
			for(var j in json) {
				if(typeof(json[j].Mem2BoardCpuNum) != 'undefined')
					html += '<tr>' +
						'<td>CPU ' + json[j].Mem2BoardCpuNum + '</td>' +
						'<td>' + ILOParser.helpers.memoryErrorState(json[j].Mem2BoardErrorStat) + '</td>' +
						'<td>' + ILOParser.helpers.statePresenceMemory(json[j].Mem2BoardOnlineStat) + '</td>' +
						'<td>' + ILOParser.helpers.memoryLockState(json[j].Mem2BoardLocked) + '</td>' +
						'<td>' + ILOParser.helpers.memoryPlug(json[j].Mem2BoardHotPlug) + '</td>' +
						'<td>' + ILOParser.helpers.memorySize(json[j].Mem2BoardTotalMemSize) + '</td>' +
						'<td>' + ILOParser.helpers.memorySize(json[j].Mem2BoardOsMemSize) + '</td>' +
						'<td>' + ILOParser.helpers.isUndefined(json[j].Mem2BoardOper_Freq) + ' MHz</td>' +
						'<td>' + ILOParser.helpers.memoryVolt(json[j].Mem2BoardOper_Volt) + '</td>' +
					'</tr>';
			}
			html += '</table>';
			return html;
		},
		cpu: function() {
			var json = ILOParser.json || [];
			var html = '<table id="t01" border="3" align="center">' +
				'<caption>' + ILOParser.getName() + '</caption>' +
			'</table>';
			for(var j in json){
				if(typeof(json[j].CpuSocketNum) != 'undefined')
					html += '<br /><br />' +
					'<table border="3" align="center"' +
						'<tr><th style="width:200px;">' + "Socket number" + '</th><td>' + ILOParser.helpers.isUndefined(json[j].CpuSocketNum) + '</td></tr>' +
						'<tr><th>' + "Cores" + '</th><td>' + ILOParser.helpers.cpuUndefined(json[j].CpuCore) + '</td></tr>' +
						'<tr><th>' + "Processor Name" + '</th><td>' + ILOParser.helpers.isUndefined(json[j].CpuName) + '</td></tr>' +
						'<tr><th>' + "Slot" + '</th><td>' + ILOParser.helpers.cpuUndefined(json[j].CpuSlot) + '</td></tr>' +
						'<tr><th>' + "Status" + '</th><td>' + ILOParser.helpers.cpuConditionState(json[j].CpuStat) + '</td></tr>' +
						'<tr><th>' + "Max Threads" + '</th><td>' + ILOParser.helpers.isUndefined(json[j].CPUCoreMaxThreads) + '</td></tr>' +
						'<tr><th>' + "CPU Speed" + '</th><td>' + ILOParser.helpers.cpuSpeedCondition(json[j].CpuSpeed) + '</td></tr>' +
						'<tr><th>' + "CPU Max Speed" + '</th><td>' + ILOParser.helpers.cpuSpeedCondition(json[j].CPUMaxSpeed) + '</td></tr>' +
					'</table>';
			}
			return html;
		},
		network: function() {
			var json = ILOParser.json || [];
			var html = '<table id="t01" border="3" align="center">' +
			'<caption>' + ILOParser.getName() + '</caption>' +
			'<tr></tr><tr><th>' +  'Port' + '</th><th>' + 'Model' + '</th><th>' + 'Status'   + '</th><th>' + 'Duplex' + '</th><th>' + 'Base I/O Address' +	'</th><th>' + 'Slot' + '</th><th>' + 'Mac Address' + '</th><th>' +  ' Firmware Version' + '</th></tr>';
			for(var j in json) {
				if(typeof(json[j].NIPANam) != 'undefined')
					html += '<tr>' +
						'<td>' + ILOParser.helpers.netPort(json[j].NIPAPort) + '</td>' +
						'<td>' + ILOParser.helpers.isUndefined(json[j].NIPANam)   + '</td>' +
						'<td>' + ILOParser.helpers.netState(json[j].NIPAStatus) + '</td>' +
						'<td>' + ILOParser.helpers.netDuplex(json[j].NIPADuplexState) + '</td>' +
						'<td>' + ILOParser.helpers.netIO(json[j].NIPAIoAddr) + '</td>' +
						'<td>' + ILOParser.helpers.netSlot(json[j].NIPASlot) + '</td>' +
						'<td>' + ILOParser.helpers.isUndefined(json[j].NIPAMACAddr) + '</td>' +
						'<td>' + ILOParser.helpers.isUndefined(json[j].NIPAFWVer) + '</td>' +
					'</tr>';
			}
			html += '</table>';
			return html;
		},
	},
	helpers: {
		trim: function(s) {
			if(typeof(s) != 'string')
				return s;
			return s.replace(/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g, '');
		},
		isUndefined: function(value) {
			if(typeof(value) == 'undefined') return "N/A";
			value = ILOParser.helpers.trim(value);
			if(value === "") return "N/A";
			return value;
		},
		summaryFieldname: function(value) {
			if(typeof(value) == 'undefined') return "N/A";
			switch (parseInt(value)) {
				case 0: return "System Health Status";
				case 1: return 'Total Aggregate + <abbr title="Integrated Management Log">IML</abbr>';
				case 2: return "Processors";
				case 3: return "Memory";
				case 4: return "Cooling";
				case 5: return "Sensors";
				case 6: return "Power";
				case 7: return '<abbr title="Clear the Integrated Management Log in ILO to reset this alarm">ProLiant Logs</abbr>';
				case 8: return '<abbr title="Active System Recovery">ASR</abbr>';
				case 9: return "Drive Array";
				case 10: return "SCSI";
				case 11: return "Storage Enclosures";
				case 12: return "IDE";
				case 13: return '<abbr title="Fibre Channel Switch">FC</abbr>';
				case 14: return "Networks";
				case 15: return "MP";
				case 16: return "HW/BIOS";
				case 17: return "Battery";
				case 18: return "iSCSI";
				default: return "N/A";
			}
		},
		stateCondition: function(value) { // http://oid-info.com/get/1.3.6.1.4.1.232.6.2.6.7.1.9
			if(typeof(value) == 'undefined') return "N/A";
			switch (value) {
				case 1: return "Unknown";
				case 2: return "Ok";
				case 3: return "Degraded";
				case 4: return "Failed";
				default: return "N/A";
			}
		},
		statePresence: function(value) {
			if(typeof(value) == 'undefined') return "N/A";
			switch (value) {
				case 1: return "Unknown";
				case 2: return "Absent";
				case 3: return "Present";
				default: return "N/A";
			}
		},
		statePresenceMemory: function(value) {
			if(typeof(value) == 'undefined') return "N/A";
			switch (value) {
				case 1: return "Other";
				case 2: return "Absent";
				case 3: return "Present";
				default: return "N/A";
			}
		},
		fanType: function(value) { // http://oid-info.com/get/1.3.6.1.4.1.232.6.2.6.7.1.5
			if(typeof(value) == 'undefined') return "N/A";
			switch (value) {
				case 1: return "Other";
				case 2: return "Tach Output";
				case 3: return "Spin Detect";
				default: return "N/A";
			}
		},
		fanLocation: function(value) { // http://oid-info.com/get/1.3.6.1.4.1.232.6.2.6.7.1.3
			if(typeof(value) == 'undefined') return "N/A";
			switch (value) {
				case 1: return "Other";
				case 2: return "Unknown";
				case 3: return "System";
				case 4: return "SystemBoard";
				case 5: return "IOBoard";
				case 6: return "Cpu";
				case 7: return "Memory";
				case 8: return "Storage";
				case 9: return "Removable Media";
				case 10: return "Power Supply";
				case 11: return "Ambient";
				case 12: return "Chassis";
				case 13: return "BridgeCard";
				case 14: return "ManagementBoard";
				case 15: return "Backplane";
				case 16: return "NetworkSlot";
				case 17: return "BladeSlot";
				case 18: return "Virtual";
				default: return "N/A";
			}			
		},
		fanPlug: function(value) { // http://oid-info.com/get/1.3.6.1.4.1.232.6.2.6.7.1.10
			if(typeof(value) == 'undefined') return "N/A";
			switch (value) {
				case 1: return "Other";
				case 2: return "Non Hot Plug";
				case 3: return "Hot Plug";
				default: return "N/A";
			}
		},
		fanSpd: function(value) { // http://oid-info.com/get/1.3.6.1.4.1.232.6.2.6.7.1.6 Ist aber in RPM????
			if(typeof(value) == 'undefined') return "N/A";
			switch (value) {
				case 1: return "Other";
				case 2: return "Normal";
				case 3: return "High";
				default: return "N/A";
			}
		},
		fanRedundancy: function(value) { // http://oid-info.com/get/1.3.6.1.4.1.232.6.2.6.7.1.7 keine werte...
			if(typeof(value) == 'undefined') return "N/A";
			switch (value) {
				case 1: return "Other";
				case 2: return "Non Redundant";
				case 3: return "Redundant";
				default: return "N/A";
			}
		},
		tempLocation: function(value) { // http://oid-info.com/get/1.3.6.1.4.1.232.6.2.6.8.1.3
			if(typeof(value) == 'undefined') return "N/A";
			switch (value) {
				case 1: return "Other";
				case 2: return "Unknown";
				case 3: return "System";
				case 4: return "SystemBoard";
				case 5: return "IOBoard";
				case 6: return "CPU";
				case 7: return "Memory";
				case 8: return "Storage";
				case 9: return "Removable Media";
				case 10: return "Power Supply";
				case 11: return "Ambient";
				case 12: return "Chassis";
				case 13: return "BridgeCard";
				default: return "N/A";
			}
		},
		tempCondition: function(value) { // http://oid-info.com/get/1.3.6.1.4.1.232.6.2.6.8.1.6
			if(typeof(value) == 'undefined') return "N/A";
			switch (value) {
				case 1: return "Other";
				case 2: return "OK";
				case 3: return "Degraded";
				case 4: return "Failed";
				default: return "N/A";
			}
		},
		tempThresholdType: function(value) { // http://oid-info.com/get/1.3.6.1.4.1.232.6.2.6.8.1.7
			if(typeof(value) == 'undefined') return "N/A";
			switch (value) {
				case 1: return "Other";
				//case 2: return "Blowout";
				case 5: return "Blowout";
				//case 3: return "Caution";
				case 9: return "Caution";
				//case 4: return "Critical";
				case 15: return "Critical";
				//case 5: return "No reaction";
				case 16: return "No reaction";
				default: return "Unknown TempThrType " + value;
			}
		},
		storageControllerModel: function(value) { // http://oid-info.com/get/1.3.6.1.4.1.232.3.2.2.1.1.2
			if(typeof(value) == 'undefined') return "N/A";
			switch (value) {
				case 1: return "Other";
				case 2: return "IDA";
				case 3: return "IDA Expansion";
				case 4: return "IDA-2";
				case 5: return "SMART ";
				case 6: return "SMART-2/E ";
				case 7: return "SMART-2/P ";
				case 8: return "SMART - 2SL";
				case 9: return "Smart - 3100ES";
				case 10: return "Smart - 3200";
				case 11: return "SMART - 2DH";
				case 12: return "Smart - 221";
				case 13: return "Smart Array 4250ES";
				case 14: return "Smart Array 4200";
				case 15: return "Integrated Smart Array";
				case 16: return "Smart Array 431";
				case 17: return "Smart Array 5300";
				case 18: return "RAID LC2 Controller";
				case 19: return "Smart Array 5i";
				case 20: return "Smart Array 532";
				case 21: return "Smart Array 5312";
				case 22: return "Smart Array 641";
				case 23: return "Smart Array 642";
				case 24: return "Smart Array 6400";
				case 25: return "Smart Array 6400 EM";
				case 26: return "Smart Array 6i ";
				case 27: return "Generic Array";
				case 28: return "Reserved ";
				case 29: return "Smart Array P600";
				case 30: return "Smart Array P400";
				case 31: return "Smart Array E200";
				case 32: return "Smart Array E200i";
				case 33: return "Smart Array P400i";
				case 34: return "Smart Array P800";
				case 35: return "Smart Array E500";
				case 36: return "Smart Array P700m";
				case 37: return "Smart Array P212";
				case 38: return "Smart Array P410";
				case 39: return "Smart Array P410i";
				case 40: return "Smart Array P411";
				case 41: return "Smart Array B110i SATA RAID";
				case 42: return "Smart Array P712m";
				case 43: return "Smart Array P711m";
				case 44: return "Smart Array P812";
				case 45: return "StorageWorks 1210m";
				case 46: return "Smart Array P220i";
				case 47: return "Smart Array P222";
				case 48: return "Smart Array P420";
				case 49: return "Smart Array P420i";
				case 50: return "Smart Array P421";
				case 51: return "Smart Array B320i";
				case 52: return "Smart Array P822";
				case 53: return "Smart Array P721m";
				case 54: return "Smart Array B120i";
				case 55: return "HP Storage p1224";
				case 56: return "HP Storage p1228";
				case 57: return "HP Storage p1228m";
				case 58: return "Smart Array P822se";
				case 59: return "HP Storage p1224e";
				case 60: return "HP Storage p1228e";
				case 61: return "HP Storage p1228em";
				case 62: return "Smart Array P230i";
				case 63: return "Smart Array P430i";
				case 64: return "Smart Array P430";
				case 65: return "Smart Array P431";
				case 66: return "Smart Array P731m";
				case 67: return "Smart Array P830i";
				case 68: return "Smart Array P830";
				case 69: return "Smart Array P831";
				case 70: return "Smart Array P530";
				case 71: return "Smart Array P531";
				case 72: return "Smart Array P244br";
				case 73: return "Smart Array P246br";
				case 74: return "Smart Array P440";
				case 75: return "Smart Array P440ar";
				case 76: return "Smart Array P441";
				case 77: return "Smart Array P741m";
				case 78: return "Smart Array P840";
				case 79: return "Smart Array P841";
				case 80: return "Smart HBA H240ar";
				case 81: return "Smart HBA H244br";
				case 82: return "Smart HBA H240";
				case 83: return "Smart HBA H241";
				case 84: return "Smart Array B140i";
				case 85: return "Generic HBA";
				case 86: return "Smart Array P240nr";
				case 87: return "Smart HBA H240nr";
				case 88: return "Smart Array P840ar";
				case 89: return "Smart Array P542D";
				case 90: return "Smart Array S100i SR Gen10";
				case 91: return "Smart Array E208i-p SR Gen10";
				case 92: return "Smart Array E208i-a SR Gen10";
				case 93: return "Smart Array E208i-c SR Gen10";
				case 94: return "Smart Array E208e-p SR Gen10";
				case 95: return "Smart Array P204i-b SR Gen10";
				case 96: return "Smart Array P204i-c SR Gen10";
				case 97: return "Smart Array P408i-p SR Gen10";
				case 98: return "Smart Array P408i-a SR Gen10";
				case 99: return "Smart Array P408e-p SR Gen10";
				case 100: return "Smart Array P408i-c SR Gen10";
				case 101: return "Smart Array P408e-m SR Gen10";
				case 102: return "Smart Array P416ie-m SR Gen10";
				case 103: return "Smart Array P816i-a SR Gen10";
				case 104: return "Smart Array P408i-sb SR Gen10";
				default: return "Unknown model " + value;
			}
		},
		storageControllerRebuildPrio: function(value) { // http://oid-info.com/get/1.3.6.1.4.1.232.3.2.2.1.1.23
			if(typeof(value) == 'undefined') return "N/A";
			switch (value) {
				case 1: return "Other";
				case 2: return "Low";
				case 3: return "Medium";
				case 4: return "High";
				case 5: return "Medium High";
				default: return "N/A";
			}
		},
		/*storageControllerTemp: function(value) {
			return ILOParser //ILOParser.helpers.storageControllerRebuildPrio(value); // Gleich wie RePri Bloedsinn
		},*/
		storageControllerTemp: function(value) { // http://oid-info.com/get/1.3.6.1.4.1.232.3.2.2.1.1.32
			var value_safe = ILOParser.helpers.isUndefined(value);
			if(value_safe == -1 || value_safe == '-1' || value_safe == '')
				return "N/A";
			return value_safe;
		},
		memoryErrorState: function(value) {
			if(typeof(value) == 'undefined') return "N/A";
			switch (value) {
				case 1: return "Other";
				case 2: return "noError";
				case 3: return "dimmEccError";
				case 4: return "unlockError";
				case 5: return "configError";
				case 6: return "busError";
				case 7: return "powerError";
				case 8: return "advancedEcc";
				case 9: return "onlineSpare";
				case 10: return "mirrored";
				case 11: return "mirroredDimmError";
				case 12: return "memoryRaid";
				case 13: return "raidDimmError";
				case 14: return "lockStep";
				case 15: return "lockStepError";
				default: return "N/A";
			}
		},
		memoryLockState: function(value) {
			if(typeof(value) == 'undefined') return "N/A";
			switch (value) {
				case 1: return "Other";
				case 2: return "Unlocked";
				case 3: return "Locked";
				default: return "N/A";
			}
		},
		memoryPlug: function(value) {
			if(typeof(value) == 'undefined') return "N/A";
			switch (value) {
				case 1: return "Other";
				case 2: return "Non Hot Plug";
				case 3: return "Hot Plug";
				default: return "N/A";
			}
		},
		memorySize: function(value) {
			value = ILOParser.helpers.isUndefined(value);
			if(value == "N/A") return value;
			var value_int = parseInt(value);
			if(value_int == NaN) return "Not a number";
			if(value_int == 0) return "0 B";
			return (value_int / 1024) + " GB";
		},
		memoryVolt: function(value) {
			value = ILOParser.helpers.isUndefined(value);
			if(value == "N/A") return value;
			var value_int = parseInt(value);
			if(value_int == NaN) return "Not a number";
			return (value_int / 1000) + " V";
		},
		cpuConditionState: function(value) {
			if(typeof(value) == 'undefined') return "N/A";
			switch (value) {
				case 1: return "Unknown";
				case 2: return "Ok";
				case 3: return "Degraded";
				case 4: return "Failed";
				case 5: return "Disabled";
				default: return "N/A";
			}
		},
		cpuUndefined: function(value) {
			var value_safe = ILOParser.helpers.isUndefined(value);
			if(value_safe == 0 || value_safe == '0')
				return "Can't be determined";
			return value_safe;
		},
		cpuSpeedCondition: function(value) {
			var value_safe = ILOParser.helpers.isUndefined(value);
			if(value_safe == 0 || value_safe == '0')
				return "Unavailable";
			return value_safe;
		},
		netIO: function(value) {
			var value_safe = ILOParser.helpers.isUndefined(value);
			if(value_safe == 0 || value_safe == '0' || value_safe == '')
				return "N/A";
			return value_safe;
		},
		netPort: function(value) {
			var value_safe = ILOParser.helpers.isUndefined(value);
			if(value_safe == -1 || value_safe == '-1' || value_safe == '')
				return "N/A";
			return value_safe;
		},
		netSlot: function(value) { // http://oid-info.com/get/1.3.6.1.4.1.232.18.2.3.1.1.5
			var value_safe = ILOParser.helpers.isUndefined(value);
			if(value_safe == 0 || value_safe == '0')
				return "Embedded";
			return value_safe;
		},
		netState: function(value) { // http://oid-info.com/get/1.3.6.1.4.1.232.18.2.3.1.1.14
			if(typeof(value) == 'undefined') return "N/A";
			switch (value) {
				case 1: return "Unknown";
				case 2: return "Ok";
				case 3: return "GeneralFailure";
				case 4: return "LinkFailure";
				default: return "N/A";
			}
		},
		netDuplex: function(value) { // http://oid-info.com/get/1.3.6.1.4.1.232.18.2.3.1.1.11 wieder keine enum
			if(typeof(value) == 'undefined') return "N/A";
			switch (value) {
				case 1: return "Unknown";
				case 2: return "Half";
				case 3: return "Full";
				default: return "N/A";
			}
		},
	},
};


document.addEventListener("DOMContentLoaded", ILOParser.documentReadyHandler);

/*
Mibs are assigned an array element as follows. New items are added at the end.
0 - System Health Status (overall status as reported by who is reporting (agents or iLO))
1 - Total Aggregate (Includes IML Status)
2 - Processors (TBD 232.1.2.2.4:cpqSeCpuCondition)
3 - Memory (232.6.2.14.4:cpqHeResilientMemCondition)
4 - Cooling (232.6.2.6.4:cpqHeThermalSystemFanStatus)
5 - Sensors (232.6.2.6.3:cpqHeThermalTempStatus)
6 - Power (232.6.2.9.1:cpqHeFltTolPwrSupplyCondition)
7 - ProLiant Logs (232.6.2.11.2:cpqHeEventLogCondition)
8 - ASR (232.6.2.5.17:cpqHeAsrCondition)
9 - Drive Array (232.3.1.3:cpqDaMibCondition)
10 - SCSI (232.5.1.3:cpqScsiMibCondition)
11 - Storage Enclosures (232.8.1.3:cpqSsMibCondition)
12 - IDE (232.14.1.3:cpqIdeMibCondition)
13 - FC (232.16.1.3:cpqFcaMibCondition)
14 - Networks (232.18.1.3:cpqNicMibCondition)
15 - MP (232.9.1.3:cpqSm2MibCondition)
16 - HW/BIOS (232.6.2.16.1:cpqHeHWBiosCondition)
17 - Battery (232.6.2.17.1:cpqHeSysBackupBatteryCondition)
18 - iSCSI (232.169.1.3:cpqiScsiMibCondition)"
*/


