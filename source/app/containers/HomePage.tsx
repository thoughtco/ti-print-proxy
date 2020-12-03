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

    const [visibleTab, setVisibleTab] = useState('printers');
	const [serverProcess, setServerProcess] = useState({});
	const [logData, setLogData] = useState([]);
	const [printerList, setPrinterList] = useState([
		{listenport: '9001', ipaddress: '192.168.0.1', port: '9100', autostart: false, },
    ]);
	const [formValues, setFormValues] = useState({
		cert: '',
		key: ''
	});

	useEffect(() => {

		AsyncStorage.getItem('@Printer:savedValues')
		.then(savedValues => {
			if (savedValues !== null)
            {
				setFormValues(JSON.parse(savedValues));
			}
		});

		AsyncStorage.getItem('@Printer:printerList')
		.then(savedValues => {
			if (savedValues !== null)
            {

                let newPrinterList = JSON.parse(savedValues);
                setPrinterList(newPrinterList);

                // autostart printers
                newPrinterList.forEach(function(printer, idx){
                   if (printer.autostart){
                       _startServer(idx);
                   }
                });

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
				_log('Printer ' + (idx+1) + ': Listening on port ' + printerList[idx].listenport);
			});

			wss.on('error', function(error){
				_log('Printer ' + (idx+1) + ': ' + error.message);
			});

			wss.on('connection', function connection(ws){

				_log('Printer ' + (idx+1) + ': Connection');

			  	ws.on('message', function incoming(message){
				  	_log('Printer ' + (idx+1) + ': Printing');

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
			_log('Printer ' + (idx+1) + ':' + e.message);
		}

	}

	function _stopServer(idx){

		if (serverProcess[idx]){
			//serverProcess.kill('SIGINT');
			serverProcess[idx].close();
            delete serverProcess[idx];
			setServerProcess(serverProcess);
            _log('Printer ' + idx + ': Stopping');
		}

	}

	function _addPrinter(){
        let newPrinterList = [];
        for (let i=0;i<printerList.length;i++){
            newPrinterList.push(printerList[i]);
        }
        newPrinterList.push({listenport: '9001', ipaddress: '192.168.0.1', port: '9100',});
        setPrinterList(newPrinterList);
        _savePrinters(newPrinterList);
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
        _savePrinters(newPrinterList);
	}

	function _log(msg){
		logData.push('[' + new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric' }) + ']: ' + msg);
		setLogData([...logData]);
	}

    function _savePrinters(newPrinterList){
		AsyncStorage.setItem('@Printer:printerList', JSON.stringify(newPrinterList));
    }

	function handlePrinter(idx, key, event){
        let newPrinterList = [];
        for (let i=0;i<printerList.length;i++){
            newPrinterList.push(printerList[i]);
        }
		newPrinterList[idx][key] = key == 'autostart' ? event.target.checked : event.target.value;
		setPrinterList(newPrinterList);
        _savePrinters(newPrinterList);
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
            <tr style={{ height: 40 }} key={'printer' + idx}>
                  <td width="10%">
        				<a onClick={_removePrinter.bind(this, idx)}><span style={{ display: 'inline-block', background: 'url(assets/trash.svg) no-repeat', width: 18, height: 18, marginLeft: 4, marginRight: 10, marginTop: 3 }}></span></a>
                  </td>
                  <td width="20%">
        				<input
        					onChange={text => handlePrinter(idx, 'listenport', text)}
        					value={printer.listenport}
        			        autoCapitalize='none'
        			        className={styles.textInput}
                            style={{ width: 80 }}
        				/>
                  </td>
                  <td width="35%">
        				<input
        					onChange={text => handlePrinter(idx, 'ipaddress', text)}
        					value={printer.ipaddress}
        			        autoCapitalize='none'
        			        className={styles.textInput}
                            style={{ width: 140 }}
        				/>
                  </td>
                  <td width="20%">
        				<input
        					onChange={text => handlePrinter(idx, 'port', text)}
        					value={printer.port}
        			        autoCapitalize='none'
        			        className={styles.textInput}
                            style={{ width: 80 }}
        				/>
                  </td>
                  <td width="5%" align="center">
        				<input
                            type="checkbox"
        					onChange={text => handlePrinter(idx, 'autostart', text)}
        					checked={printer.autostart ? true : false}
        			        className={styles.textInput}
                            style={{ opacity: 0 }}
                            id={'fld-check-' + idx}
        				/>
                        <label htmlFor={'fld-check-' + idx}></label>
                  </td>
                  <td width="10%" style={{ textAlign: 'right' }}>
        				{!serverProcess[idx] &&
        				  <a onClick={_startServer.bind(this, idx)}><span style={{ display: 'inline-block', background: 'url(assets/play-circle.svg) no-repeat', width: 28, height: 28, marginTop: 4 }}></span></a>
        				}
        				{serverProcess[idx] &&
        				  <a onClick={_stopServer.bind(this, idx)}><span style={{ display: 'inline-block', background: 'url(assets/stop-circle.svg) no-repeat', width: 28, height: 28, marginTop: 4 }}></span></a>
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

		<div style={{ width: '100%', height: 555, display: 'flex', flexDirection: 'column', overflow: 'auto' }}>

  	      <p className={styles.tabContainer}>
            <a onClick={() => setVisibleTab('printers')} className={visibleTab == 'printers' ? styles.tabLinkSelected : styles.tabLink} style={{ marginLeft: 12 }}>Printers</a>
            <a onClick={() => setVisibleTab('ssl')} className={visibleTab == 'ssl' ? styles.tabLinkSelected : styles.tabLink} style={{ marginLeft: 22 }}>SSL</a>
            <a onClick={() => setVisibleTab('logs')} className={visibleTab == 'logs' ? styles.tabLinkSelected : styles.tabLink} style={{ marginLeft: 22 }}>Logs</a>
          </p>

          {visibleTab == 'ssl' && (
            <div style={{ width: '100%', padding: 12, paddingTop: 0, }}>

            	<label for="fld-ssl-cert" className={styles.textInputLabel} style={{ marginTop: 20 }}>Certificate</label>

            	<textarea
                    id="fld-ssl-cert"
            		onChange={text => handleChange('cert', text)}
            		value={formValues.cert}
                    autoCapitalize='none'
                    className={styles.textareaInput}
            	/>

            	<label for="fld-ssl-key" className={styles.textInputLabel} style={{ marginTop: 20 }}>Private key</label>

            	<textarea
                    id="fld-ssl-key"
            		onChange={text => handleChange('key', text)}
            		value={formValues.key}
                    autoCapitalize='none'
                    className={styles.textareaInput}
            	/>

            </div>
        )}

        {visibleTab == 'printers' && (
            <div style={{ width: '100%' }}>

        		<div style={{ flex: 1, paddingTop: 20, paddingLeft: 12, paddingRight: 12, }}>

                    <table width="100%">
                      <thead>
                          <tr>
                            <th> </th>
                            <th className={styles.textInputLabel}>Listen port</th>
                            <th className={styles.textInputLabel}>Printer IP</th>
                            <th className={styles.textInputLabel}>Printer port</th>
                            <th className={styles.textInputLabel}>Autostart</th>
                            <th> </th>
                          </tr>
                      </thead>
                      <tbody id="printerList">
                        {outputPrinters}
                      </tbody>
                    </table>

                    <div style={{ marginTop: 12, marginBottom: 20 }}>
                		<a onClick={_addPrinter.bind(this)}><span style={{ display: 'inline-block', background: 'url(assets/plus-circle.svg) no-repeat', width: 28, height: 28 }}></span></a>
                    </div>

        		</div>

            </div>)
        }

        {visibleTab == 'logs' && (
    		<div style={{ width: '100%', flex: 1, overflow: 'scroll' }}>
    			<pre style={{ padding: 12, margin: 0, fontSize: 12 }}>{[...logData].reverse().join("\n")}</pre>
    		</div>)
        }

        </div>

	</div>
	);

}
