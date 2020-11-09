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

export default function App() {

	const [serverProcess, setServerProcess] = useState({});
	const [logData, setLogData] = useState([]);
	const [printerList, setPrinterList] = useState([
		{listenport: '9001', ipaddress: '192.168.0.1', port: '9100',},
    ]);
	const [formValues, setFormValues] = useState({
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

		AsyncStorage.getItem('@Printer:printerList')
		.then(savedValues => {
			if (savedValues !== null) {
				setPrinterList(JSON.parse(savedValues));
			}
		});

	}, []);

	function _startServer(idx){

		_log('Starting printer ' + idx);

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
				_log('printer ' + idx + ' listening for connections on port ' + printerList[idx].listenport);
			});

			wss.on('error', function(error){
				_log(error.message);
			});

			wss.on('connection', function connection(ws){

				_log('Connection to printer ' + idx);

			  	ws.on('message', function incoming(message){
				  	_log('Printing');

				  	// removed this intentionally - send the buffer not a string
				  	//message = message.toString();

				  	nc2
				  	.addr(printerList[idx].ipaddress)
				  	.port(parseInt(printerList[idx].port))
				  	.tcp()
				  	.connect()
				  	.end(message);

			  	});

			});

			server.listen(printerList[idx].listenport);

            serverProcess[idx] = server;
			setServerProcess(serverProcess);

		} catch (e){
			_log(e.message);
		}

	}

	function _stopServer(idx){

		if (serverProcess[idx]){
			//serverProcess.kill('SIGINT');
			serverProcess[idx].close();
            delete serverProcess[idx];
			setServerProcess(serverProcess);
		}

		_log('Stopping printer ' + idx);

	}

	function _addPrinter(){
        let newPrinterList = [];
        for (let i=0;i<printerList.length;i++){
            newPrinterList.push(printerList[i]);
        }
        newPrinterList.push({listenport: '9001', ipaddress: '192.168.0.1', port: '9100',});
        setPrinterList(newPrinterList);
	}

	function _removePrinter(idx){
        let newPrinterList = [];
        for (let i=0;i<printerList.length;i++){
            if (i != idx){
                newPrinterList.push(printerList[i]);
            } else {
                _stopServer(idx);
            }
        }
        setPrinterList(newPrinterList);
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

	function handlePrinter(idx, key, event){
        let newPrinterList = [];
        for (let i=0;i<printerList.length;i++){
            newPrinterList.push(printerList[i]);
        }
		newPrinterList[idx][key] = event.target.value;
		setPrinterList(newPrinterList);
		AsyncStorage.setItem('@Printer:printerList', JSON.stringify(newPrinterList));
	}

	function handleChange(key, event){
		formValues[key] = event.target.value;
		setFormValues({...formValues});
		AsyncStorage.setItem('@Printer:savedValues', JSON.stringify(formValues));
	}

    let outputPrinters = [];
    function run_outputPrinters(){

        outputPrinters = [];

        printerList.forEach(function(printer, idx){
        outputPrinters.push((
            <tr style={{ height: 40 }}>
                  <td width="10%">
        				<a onClick={_removePrinter.bind(this, idx)} className={styles.buttonRemove}>X</a>
                  </td>
                  <td width="20%">
        				<input
        					onChange={text => handlePrinter(idx, 'listenport', text)}
        					value={printer.listenport}
        			        autoCapitalize='none'
        			        className={styles.textInput}
                            style={{ width: 90 }}
        				/>
                  </td>
                  <td width="30%">
        				<input
        					onChange={text => handlePrinter(idx, 'ipaddress', text)}
        					value={printer.ipaddress}
        			        autoCapitalize='none'
        			        className={styles.textInput}
        				/>
                  </td>
                  <td width="20%">
        				<input
        					onChange={text => handlePrinter(idx, 'port', text)}
        					value={printer.port}
        			        autoCapitalize='none'
        			        className={styles.textInput}
                            style={{ width: 90 }}
        				/>
                  </td>
                  <td width="20%" style={{ textAlign: 'right' }}>
        				{!serverProcess[idx] &&
        				  <a onClick={_startServer.bind(this, idx)} className={styles.buttonStart}>Start</a>
        				}
        				{serverProcess[idx] &&
        				  <a onClick={_stopServer.bind(this, idx)} className={styles.buttonStop}>
        				  	Stop
        				  </a>
        				}
                  </td>
                </tr>
              )
            );
        }, this);

    }

    run_outputPrinters();

	return (
	<div className={styles.container}>

		<div style={{ width: '100%', height: 360, display: 'flex', flexDirection: 'column', overflow: 'auto' }}>

  	      <p style={{ fontSize: 24, marginBottom: 10 }}>Setup</p>

		  <div style={{ width: '100%', display: 'flex', flexDirection: 'row', backgroundColor: '#ccc' }}>

  			<div style={{ padding: 20, paddingTop: 10 }}>

  				<p className={styles.textInputLabel}>SSL cert</p>

  				<textarea
  					onChange={text => handleChange('cert', text)}
  					value={formValues.cert}
  			        autoCapitalize='none'
  			        className={styles.textareaInput}
  				/>

            </div>

  		    <div style={{ padding: 20, paddingTop: 10, paddingLeft: 0, marginLeft: -15 }}>

  				<p className={styles.textInputLabel}>SSL key</p>

  				<textarea
  					onChange={text => handleChange('key', text)}
  					value={formValues.key}
  			        autoCapitalize='none'
  			        className={styles.textareaInput}
  				/>

            </div>

        </div>

		<div style={{ flex: 1, paddingTop: 20, }}>

        <table width="100%">
          <tr>
            <th> </th>
            <th className={styles.textInputLabel}>Listen port</th>
            <th className={styles.textInputLabel}>Printer IP</th>
            <th className={styles.textInputLabel}>Printer port</th>
            <th> </th>
          </tr>
          <tbody id="printerList">
            {outputPrinters}
          </tbody>
        </table>

        <div style={{ marginTop: 20 }}>
    		  <a onClick={_addPrinter.bind(this)} className={styles.buttonAdd}>Add printer</a>
        </div>

			</div>

		</div>

		<div style={{ width: '100%', flex: 1, paddingTop: 20 }}>

			<p style={{ fontSize: 24, marginBottom: 10 }}>Logs</p>

			<div style={{ fontSize: 12, borderWidth: 1, borderStyle:'solid', borderColor: '#ccc', overflow: 'scroll', height: 120, boxSizing:'border-box', width: '100%' }}>
				<pre style={{ padding: 0, margin: 0 }}>{[...logData].reverse().join("\n")}</pre>
			</div>

		</div>

	</div>
	);

}
