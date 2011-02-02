function print(str)
{
	if(typeof(console) == 'undefined')
	{
		postMessage({type:EV_PRINT, 'str':str});
	}
	else
	{
		//console.log(str);
	}
}


asyncGetBinary = function(url, handler, err_handler, body)
{
	var XHR = new XMLHttpRequest(),
		timer = setTimeout(function()
		{
			if(XHR.readyState != 4)
			{
				XHR.abort();
				err_handler();
			}
		}, 5000);
	
	XHR.open("POST", url, true);
	XHR.onreadystatechange = function()
	{
		print("XHR State changed: " + XHR.readyState);
	
		if(XHR.readyState == 4)
		{
			if(XHR.status == 200)
			{
				var str = XHR.responseText;
				var arr = new Uint8Array(str.length);
				
				for(var i=0; i<str.length; i++)
				{
					arr[i] = str.charCodeAt(i) & 0xff;
				}
			
				handler(arr);
			}
			else
			{
				err_handler();
			}
		}
	}
	
	print("Sending XHR");
	XHR.send(body);
	
	print("XHR sent: " + XHR.readyState);
}

arr2str = function(arr)
{
	var str = "";
	for(var i=0; i<arr.length; i++)
	{
		str += String.fromCharCode(arr[i] + 0xB0);
	}
	return str;
}

mmult = function(A, B)
{
	var C = new Float32Array(16);
	
	for(var i=0; i<4; i++)
	{
		for(var j=0; j<4; j++)
		{
			x = 0.0
			for(var k=0; k<4; k++)
			{
				x += A[i + 4*k] * B[k + 4*j];
			}
			C[i + 4*j] = x;
		}
	}
	return C;
}

hgmult = function(M, V)
{
	var R = [0, 0, 0, 0];
	
	for(var j=0; j<4; j++)
	{
		for(var i=0; i<4; i++)
		{
			R[i] += M[i+4*j] * V[j]
		}
	}
	
	return R;
}
