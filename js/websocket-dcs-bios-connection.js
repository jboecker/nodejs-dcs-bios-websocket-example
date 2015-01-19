var ProtocolParser = function() {
	var parser = Object.create(ProtocolParser.prototype);
	
	var state = "WAIT_FOR_SYNC";
	var sync_byte_count = 0;
	var address_buffer = new ArrayBuffer(2);
	var address_uint8 = new Uint8Array(address_buffer);
	var address_uint16 = new Uint16Array(address_buffer);
	var count_buffer = new ArrayBuffer(2);
	var count_uint8 = new Uint8Array(count_buffer);
	var count_uint16 = new Uint16Array(count_buffer);
	var data_buffer = new ArrayBuffer(2);
	var data_uint8 = new Uint8Array(data_buffer);
	var data_uint16 = new Uint16Array(data_buffer);
	
	parser.processChar = function(c) {
		switch(state) {
			case "WAIT_FOR_SYNC":
			break;
			
			case "ADDRESS_LOW":
				address_uint8[0] = c;
				state = "ADDRESS_HIGH";
			break;
			
			case "ADDRESS_HIGH":
				address_uint8[1] = c;
				if (address_uint16[0] != 0x5555) {
					state = "COUNT_LOW";
				} else {
					state = "WAIT_FOR_SYNC";
				}
			break;
			
			case "COUNT_LOW":
				count_uint8[0] = c;
				state = "COUNT_HIGH";
			break;
			
			case "COUNT_HIGH":
				count_uint8[1] = c;
				state = "DATA_LOW";
			break;
			
			case "DATA_LOW":
				data_uint8[0] = c;
				count_uint16[0]--;
				state = "DATA_HIGH";
			break;
			
			case "DATA_HIGH":
				data_uint8[1] = c;
				count_uint16[0]--;
				$(document).trigger("dcs-bios-write", [address_uint16, data_uint16]);
				address_uint16[0] += 2;
				if (count_uint16[0] == 0) {
					state = "ADDRESS_LOW";
				} else {
					state = "DATA_LOW";
				}
			break;
				
		}
		
		if (c == 0x55)
			sync_byte_count++;
		else
			sync_byte_count = 0;
			
		if (sync_byte_count == 4) {
			state = "ADDRESS_LOW";
			sync_byte_count = 0;
			$(document).trigger("dcs-bios-frame-sync");
		}
	}
	
	return parser;
}

$(function() {
	var socket = io.connect();
	var parser = ProtocolParser();
	socket.on("dcs-bios-data", function(message) {
		var data = new DataView(message);
		for (var i=0; i<data.byteLength; i++) {
			parser.processChar(data.getUint8(i));
		}
	});
	
	$(document).on("dcs-bios-send", function(evt, msg) {
		socket.emit("dcs-bios-send", msg);
	});
	
});
