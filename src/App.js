import React, { Component } from 'react';
import openSocket from 'socket.io-client';
const socket = openSocket('https://node-server-fakcord.herokuapp.com/');

class App extends Component {

    constructor(props) {
        super(props);
        this.state = {
            channelSelected: '#General',
            username: 'invité',
            usertemp: '',
            temp: '',
            tempMessage: '',
            channels: [],
            messages: [],
            users: []
        }
        this.onChange = this.onChange.bind(this);
        this.handlePseudo = this.handlePseudo.bind(this);
        this.handleChange = this.handleChange.bind(this);
        this.handleMessage = this.handleMessage.bind(this);
    }

    componentDidMount() {

        /*
        * Connexion user au channel
        */
        socket.on('newuser', (user) => {
            this.setState({
                messages: this.state.messages.concat({
                    channel: this.state.channelSelected,
                    author: 'system',
                    content: user.username + ' has joined the channel.',
                    to: '',
                    wishper: 'no'
                })
            })
        });

        /*
        * Renomé direct 
        */
        socket.on('renameuser', (user) => {
            this.setState({
                messages: this.state.messages.concat({
                    channel: this.state.channelSelected,
                    author: 'system',
                    content: user.username + ' has evolved to ' + user.rename,
                    to: '',
                    wishper: 'no'
                })
            })
        });

        /*
        * Deconnexion d'un utilisateur
        */
        socket.on('disuser', (user) => {
            this.setState({
                messages: this.state.messages.concat({
                    channel: this.state.channelSelected,
                    author: 'system',
                    content: user.username + ' is gone forever',
                    to: '',
                    wishper: 'no'
                })
            })
        });

        /*
        */
        socket.on('listUsers', (user) => {
            this.setState({ users: [] });
            for (var i in user) {
                this.setState({ users: this.state.users.concat(user[i]) });
            }
        })

        /*
        * Définir les messages
        */
        socket.on('newmsg', (message) => {
            this.setState({
                messages: this.state.messages.concat({
                    channel: message.messages.messages.channel,
                    author: message.messages.messages.author,
                    content: message.messages.messages.content,
                    to: message.messages.messages.to,
                    wishper: message.messages.messages.wishper
                })
            })
        })

        /*
        */
        socket.on('listChannels', (channels) => {
            this.setState({ channels: [] });
            for (var i in channels) {
                this.setState({ channels: this.state.channels.concat(channels[i]) });
            }
        })
    }

    /*
    * Pour la connexion
    */
    onChange(event) {
        this.setState({ usertemp: event.target.value })
    }

    handlePseudo(event) {
        event.preventDefault();
        socket.emit('login', { username: this.state.usertemp })
        this.setState({ username: this.state.usertemp })
    }

    /*
    * Fonction pour commande /msg
    */
    commandMsg(tab) {
        tab = tab.filter(word => word !== tab[0]);
        this.setState({
            tempMessage: {
                channel: this.state.channelSelected,
                author: this.state.username,
                content: tab.filter(word => word !== tab[0]).join(' '),
                to: tab[0],
                wishper: 'yes'
            }
        });
    }


    /*
    * Fonction pour commande /nick changer pseudo
    */
    commandName(tab, event) {
        socket.emit('rename', {
            username: this.state.username,
            rename: tab[1],
        });
        this.setState({ username: tab[1] });
    }

    /*
    * Fonction pour commande /create 
    */
    commandCreate(tab) {
        var listChan = this.state.channels.filter(channel => channel === '#' + tab[1]);
        if (listChan.length === 0) {
            this.setState({
                tempMessage: {
                    channel: this.state.channelSelected,
                    author: 'system',
                    content: 'A new channel has been created : #' + tab[1],
                    to: '',
                    wishper: 'no'
                }
            });
            socket.emit('newChannel', {
                channel: tab[1]
            })
            socket.emit('newmessage', { messages: this.state.tempMessage });
        }
        if (listChan.length >= 1) {
            this.setState({
                tempMessage: {
                    channel: this.state.channelSelected,
                    author: 'system',
                    content: 'Ce channel existe déjà',
                    to: '',
                    wishper: 'no'
                }
            });
            socket.emit('newmessage', { messages: this.state.tempMessage });
        }
        return true;
    }


    commandJoin(tab) {
        this.setState({ channelSelected: tab[1] })
    }

    



    //Pour l'envoi de message
    handleChange(event) {
        this.setState({ temp: event.target.value });
        var tab = event.target.value.split(' ');
        var tabBegin = tab[0].split('');
        if (tab[0] === '/msg') {
            this.commandMsg(tab);
            return false;
        }
        if (tab[0] === '/nick') {
            return false;
        }
        if (tab[0] === '/create') {
            return false;
        }
        if (tab[0] === '/join') {
            return false;
        }
        if (tabBegin[0] !== "/") {
            this.setState({
                tempMessage: {
                    channel: this.state.channelSelected,
                    author: this.state.username,
                    content: event.target.value,
                    to: '',
                    wishper: 'no'
                }
            })
        }
    }



    //Confirmation du formulaire / envoi de message

    handleMessage(event) {
        event.preventDefault();
        var tab = this.state.temp.split(' ');
        if (tab[0] === '/nick') {
            if (tab[1] !== undefined && tab[1] !== '') {
                this.commandName(tab, event);
            }
            this.setState({ temp: '' });
            return false;
        }
        if (tab[0] === '/create') {
            if (tab[1] !== undefined && tab[1] !== '') {
                this.commandCreate(tab);
            }
            this.setState({ temp: '' });
            return false;
        }
        if (tab[0] === '/join') {
            if (tab[1] !== undefined && tab[1] !== '') {
                this.commandJoin(tab);
            }
        }
        socket.emit('newmessage', { messages: this.state.tempMessage });
        this.setState({ temp: '' });
    }

    
    // Afficher les messages
    
    affichMessage() {
        var tab = this.state.messages.filter(messages => messages.channel === this.state.channelSelected);
        return tab.map(message => {
            if (message.author === 'system') {
                return <span className="msg"><strong>{message.content} <br /></strong></span>
            }
            if (message.to !== '' && message.to === this.state.username) {
                return <span className="msg"><em>{message.author} wispered you </em> : {message.content} <br /></span>
            }
            if (message.to !== '' && message.author === this.state.username) {
                return <span className="msg"><em> yo sent a wishper {message.to}</em> : {message.content} <br /></span>
            }
            if (message.author !== 'system' && message.wishper === 'no') {
                return <span className="msg"><strong>{message.author}</strong> : {message.content} <br /></span>
            }
        });
    }


    
    //Afficher les membres

    affichMembers() {
        return this.state.users.map(user => {
            return <span className="users"> {user}  </span>
        });
    }

    
    //Afficher les channels 

    affichChannels() {
        return this.state.channels.map(channel => {
            return <ul>
                        <li
                        className="channels"
                        value={channel}
                        onClick={(event) => { this.setState({ channelSelected: event.target.getAttribute('value') }) }}>
                        {channel} &nbsp;
                        </li>
                    </ul>
        })
    }



    //Rendu
    

    render() {
        if (this.state.username === 'invité') {
            return (
                <div className="intro">
                    <div className="username">
                        <h1>Welcome to FakeCord</h1>
                        <div className="p-8">
                            <span className="label">
                                
                            </span>
                        </div>

                        <form>
                            <input className='chat-entry' type="text" onChange={this.onChange} />
                            <button className='btn' onClick={this.handlePseudo}>Enter</button>
                        </form>
                    </div>
                </div>
            )
        }
        if (this.state.username !== '') {
            return (
                <div className="App">
                    <div className='container'>
                        <div className="flex justify-center py-8">
                            <div className="list-gannels">
                                <div className="">
                                    #Channels<br />
                                    <ul>
                                        <li>{this.affichChannels()}</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                        <div className="text-box">
                        <div className="">
                                    <em>Welcome {this.state.username} to {this.state.channelSelected}</em>
                                </div>
                            <div className="">
                                <div>
                                    <div id="content">
                                        {this.affichMessage()}
                                        <br />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="Chat-box">
                            <div className="">
                                <div className="members">
                                    #People
                                    <ul>
                                        <li>{this.affichMembers()}</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="">
                        <span className="">
                            <div className="">
                                <form className="sendForm">
                                    <input type="text" className="input-text" id="msg" value={this.state.temp} onChange={this.handleChange} />
                                    <button className="btn" onClick={this.handleMessage}>Envoyer</button>
                                </form>
                            </div>
                        </span>
                    </div>
                </div>
            )
        }
        return (<p> {this.state.username} has joined the channel</p>);
    }
}

export default App;
