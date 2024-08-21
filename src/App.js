import React, { Component } from 'react';
import Navigation from './components/Navigation/Navigation';
import Signin from './components/Signin/Signin';
import Register from './components/Register/Register';
import Logo from './components/Logo/Logo';
import ImageLinkForm from './components/ImageLinkForm/ImageLinkForm';
import FaceRecognition from './components/FaceRecognition/FaceRecognition';
import Rank from './components/Rank/Rank';
import ParticlesBg from 'particles-bg'
import Modal from './components/Modal/Modal';
import Profile from './components/Profile/Profile';
import 'tachyons';
import './App.css';



const returnClarifaiRequestOptions = (imageUrl) => {
  // Your PAT (Personal Access Token) can be found in the Account's Security section
  const PAT = 'afd0284010464d94bb24af2049007dff';
  // Specify the correct user_id/app_id pairings
  // Since you're making inferences outside your app's scope
  const USER_ID = 'meeky-jr';
  const APP_ID = 'face-detection';
  // Change these to whatever model and image URL you want to use
  const IMAGE_URL = imageUrl;

  const raw = JSON.stringify({
    "user_app_id": {
      "user_id": USER_ID,
      "app_id": APP_ID
    },
    "inputs": [
      {
        "data": {
          "image": {
            "url": IMAGE_URL
            // "base64": IMAGE_BYTES_STRING
          }
        }
      }
    ]
  });

  const requestOptions = {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Authorization': 'Key ' + PAT
    },
    body: raw
  };
  return requestOptions;
}

const initialState = {
  input: '',
  imageUrl: '',
  boxes: [],
  route: 'signin',
  isSignedIn: false,
  isProfileOpen: false,
  user: {
    id: '',
    name: '',
    email: '',
    password: '',
    entries: 0,
    joined: '',
    pet: '',
    age: ''
  }
}

class  App extends Component {
  constructor(){
    super();
    this.state = initialState;
  }

  componentDidMount() {
    // const token = window.sessionStorage.getItem('token');
    // if (token) {
      fetch('https://face-detection-node.onrender.com/signin', {
        method: 'post',
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin':'*',
          'Access-Control-Allow-Methods':'POST,PATCH,OPTIONS',
        }
      })
        .then(resp => resp.json())
        .then(user => {
          // if (data && data.id) {
          //   fetch(`https://face-detection-node.onrender.com/profile/${data.id}`, {
          //     method: 'get',
          //     headers: {
          //       'Content-Type': 'application/json',
          //       'Access-Control-Allow-Origin':'*',
          //       'Access-Control-Allow-Methods':'POST,PATCH,OPTIONS',
          //     }
          //   })
          //   .then(resp => resp.json())
          //   .then(user => {
              if (user && user.email) {
                this.loadUser(user)
                this.onRouteChange('home');
              }
            // })
          // }
        })
        .catch(console.log)
    // }
  }

  loadUser = (data) => {
    this.setState({user:{ 
      id: data.id,
      name: data.name,
      email: data.email,
      password: data.password,
      entries: data.entries,
      joined: data.joined
    }})
  }


  calculateFaceLocations = (data) => {
    if (data && data.outputs) {
      return data.outputs[0].data.regions.map(face => {
        const clarifaiFace = face.region_info.bounding_box;
        const image = document.getElementById('inputimage')
        const width = Number(image.width);
        const height = Number(image.height);
        return {
        leftCol: clarifaiFace.left_col * width,
        topRow: clarifaiFace.top_row * height,
        rightCol: width - (clarifaiFace.right_col * width),
        bottomRow: height - (clarifaiFace.bottom_row * height)
        }
      })  
    }
    return;
  }



  displayFaceBoxs = (boxes) => {
    if (boxes) {
      this.setState({boxes: boxes})
    }
  }
  
  onInputChange = (event) => {
    this.setState({input: event.target.value});
  }

  onButtonSubmit = () => {
    this.setState({imageUrl: this.state.input});
    fetch("https://api.clarifai.com/v2/models/face-detection/outputs", returnClarifaiRequestOptions(this.state.input))
    .then(response => response.json())
    .then(response => {
      if(response) {
        fetch('https://face-detection-node.onrender.com/image', {
          method: 'put',
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin':'*',
            'Access-Control-Allow-Methods':'POST,PATCH,OPTIONS',
            // 'Authorization': window.sessionStorage.getItem('token')
          },
          body: JSON.stringify({
            id: this.state.user.id
          })
        })
          .then(response => response.json())  
          .then(count => {
            this.setState(Object.assign(this.state.user, {entries: count}))
          })
      }
      this.displayFaceBoxs(this.calculateFaceLocations(response))
    })
    .catch(error => console.log('error', error));
  }

  onRouteChange = (route) => {
    if (route === 'signout') {
      return this.setState(initialState)
    } else if (route === 'home') {
      this.setState({isSignedIn: true})
    }
    this.setState({route: route});
  }

  toggleModal = () => {
    this.setState(prevState => ({
      ...prevState,
      isProfileOpen: !prevState.isProfileOpen
    }))
  }

  render(){
    const {isSignedIn, route, boxes, imageUrl, isProfileOpen, user} = this.state
    return (
      <div className="App">
        <ParticlesBg type="cobweb" num={100} bg={true} />
        <Navigation isSignedIn={isSignedIn} onRouteChange={this.onRouteChange} toggleModal={this.toggleModal}/>
        { isProfileOpen && 
          <Modal>
            <Profile isProfileOpen={isProfileOpen} toggleModal={this.toggleModal} user={user} loadUser={this.loadUser}/>
          </Modal>
        }
        { route === 'home' 
          ? <div> 
              <Logo />
              <Rank name={this.state.user.name} entries={this.state.user.entries} />
              <ImageLinkForm onInputChange={this.onInputChange} onButtonSubmit={this.onButtonSubmit}/>
              <FaceRecognition boxes={boxes} imageUrl={imageUrl} />
            </div> 
          :(
              route === 'signin'
              ?  <Signin loadUser={this.loadUser} onRouteChange={this.onRouteChange} />
              :  <Register loadUser={this.loadUser} onRouteChange={this.onRouteChange} />
            )
        };
       
      </div>
    );
  };
};

export default App;
