import requests

data = {
	# 'message': '!followPlayer("IndexError", 3)'
	'message': '!stop'
}

response = requests.post('http://127.0.0.1:11452/handleMessage', json = data)

print(response)