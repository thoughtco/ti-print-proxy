import React, { useState, useEffect } from 'react';
//import { StyleSheet, Text, View, TouchableOpacity, TextInput } from 'react-native';
import AsyncStorage from '@react-native-community/async-storage';
const { fork, spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const https = require('https');
const http = require('http');
const WebSocket = process.env.NODE_ENV === 'development' ? window.require('ws') : require('ws');
const net = require('net');
const { clipboard } = require('electron');
const NetcatClient = require('netcat/client');
const nc2 = new NetcatClient();

import styles from './Home.module.css';

//console.log(styles);

export default function App() {
	
	const [serverProcess, setServerProcess] = useState(null);
	const [isProcessRunning, setProcessRunning] = useState(false);
	const [logData, setLogData] = useState([]);
	
	const [formValues, setFormValues] = useState({
		listenport: '9001',
		ipaddress: '192.168.0.1',
		port: '9100',
		cert: '',
		key: ''
	});
	
	useEffect(() => {
	
		AsyncStorage.getItem('@Printer:savedValues')
		.then(savedValues => {
			if (savedValues !== null) {
				setFormValues(JSON.parse(savedValues));
			}
		});	

	}, []);
	
	function _startServer(){

		_log('Starting server');
		
		try {

			let serverOptions = {};
			
			if (formValues.cert && formValues.cert != ''){
				serverOptions = {
					cert: formValues.cert.split('\r'),
					key: formValues.key.split('\r')
				};
			}
						
			const server = serverOptions.cert ? https.createServer(serverOptions) : http.createServer();
						
			const wss = new WebSocket.Server({ server });
						
			let client;
			
			wss.on('listening', function(){
				_log('listening for connections on port ' + formValues.listenport);			
			});
			
			wss.on('error', function(error){
				_log(error.message);
			});
			
			wss.on('connection', function connection(ws){
				
				_log('Connection');
				
			  	ws.on('message', function incoming(message){
				  	_log('Printing');
				  	
				  	message = message.toString();
				  					  	
				  	nc2
				  	.addr(formValues.ipaddress)
				  	.port(parseInt(formValues.port))
				  	.tcp()
				  	.connect()
				  	.end(message);

			  	});
			  
			});
			
			server.listen(formValues.listenport);
			
			setServerProcess(server);
		
		} catch (e){
			_log(e.message);
		}
				
		setProcessRunning(true);
		
		AsyncStorage.setItem('@Printer:savedValues', JSON.stringify(formValues));
				
	}
	
	function _stopServer(){
		
		if (serverProcess){
			//serverProcess.kill('SIGINT');
			serverProcess.close();
		}
		
		setProcessRunning(false);
		_log('Stopping proxy server');
		
	}
	
	function _log(msg){
		logData.push('[' + new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric' }) + ']: ' + msg);
		setLogData([...logData]);
	}
	
	function _downloadCert(){
		
		fs.readFile(path.join(__dirname, './certs/localhost.crt'), 'utf8', function(err, contents) {
		    clipboard.writeText(contents, 'selection')
		});
	
	}
	
	function handleChange(key, event){
		formValues[key] = event.target.value;
		setFormValues({...formValues});
	}
					
	return (
	<div className={styles.container}>
	
		<div style={{ width: '100%', height: 340, display: 'flex', flexDirection: 'row', backgroundColor: '#ccc' }}>
				
			<div style={{ flex: 1, padding: 20 }}>
			
				<p style={{ fontSize: 24, marginBottom: 10 }}>Setup</p>
			
				<p className={styles.textInputLabel}>Listen on port</p>
			
				<input
					onChange={text => handleChange('listenport', text)}
					value={formValues.listenport}
			        autoCapitalize='none'
			        className={styles.textInput}
				/>
				
				<p className={styles.textInputLabel}>Printer IP address</p>
			
				<input
					onChange={text => handleChange('ipaddress', text)}
					value={formValues.ipaddress}
			        autoCapitalize='none'
			        className={styles.textInput}
				/>
				
				<p className={styles.textInputLabel}>Printer Port</p>
			
				<input
					onChange={text => handleChange('port', text)}
					value={formValues.port}
			        autoCapitalize='none'
			        className={styles.textInput}
				/>
				
			</div>
			
			<div style={{ flex: 1, padding: 20, paddingLeft: 0 }}>
			
				<p style={{ fontSize: 24, marginBottom: 10 }}>&nbsp;</p>
				
				<p className={styles.textInputLabel}>SSL cert</p>
			
				<textarea
					onChange={text => handleChange('cert', text)}
					value={formValues.cert}
			        autoCapitalize='none'
			        className={styles.textareaInput}
				/>

				<p className={styles.textInputLabel}>SSL key</p>
			
				<textarea
					onChange={text => handleChange('key', text)}
					value={formValues.key}
			        autoCapitalize='none'
			        className={styles.textareaInput}
				/>
				
				<div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
				
					<div style={{ marginTop: 25, width: 160 }}>
							
						{isProcessRunning == false && 
						  <a onClick={_startServer.bind(this)} className={styles.button}>Start print proxy</a>
						}
						{isProcessRunning && 
						  <a onClick={_stopServer.bind(this)} className={styles.button}>
						  	Stop print proxy
						  </a>
						}
						
					</div>
				
				</div>
						
			</div>
		
		</div>
		
		<div style={{ width: '100%', flex: 1, padding: 20 }}>
		
			<p style={{ fontSize: 24, marginBottom: 10 }}>Logs</p>
			
			<div style={{ fontSize: 12, borderWidth: 1, borderStyle:'solid', borderColor: '#ccc', overflow: 'scroll', height: 120, marginLeft: -20, boxSizing:'border-box', width: '100%' }}>
				<pre style={{ padding: 0, margin: 0 }}>{[...logData].reverse().join("\n")}</pre>
			</div>
		
		</div>
	
	</div>
	);
  
}