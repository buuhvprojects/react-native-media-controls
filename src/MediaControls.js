import React, { Component, PropTypes } from 'react';
import {
  Platform,
  TouchableOpacity,
  View,
  Text,
  ActivityIndicator,
  Animated,
  Image,
  UIManager,
  TouchableWithoutFeedback,
} from 'react-native';
import styles from './MediaControlsStyles';
import { humanizeVideoDuration } from './Utils';
import { PLAYER_STATE } from './Constants';
import Slider from 'react-native-slider';

class MediaControls extends Component {
  constructor(props) {
    super(props);
    this.state = {
      opacity: new Animated.Value(1),
      isVisible: true,
    };
  }

  componentDidMount() {
    // TODO remove when android supports animations
    if (Platform.OS === 'android')
      UIManager.setLayoutAnimationEnabledExperimental(true);
    this.fadeOutControls(5000);
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.playerState === PLAYER_STATE.ENDED) {
      this.fadeInControls(false);
    }
  }

  getPlayerStateIcon(playerState) {
    switch (playerState) {
      case PLAYER_STATE.PAUSED:
        return require('./assets/ic_play.png');
      case PLAYER_STATE.PLAYING:
        return require('./assets/ic_pause.png');
      case PLAYER_STATE.ENDED:
        return require('./assets/ic_replay.png');
    }
  }

  setPlayerControls(playerState) {
    let icon = this.getPlayerStateIcon(playerState);
    let pressAction =
      playerState === PLAYER_STATE.ENDED ? this.onReplay : this.onPause;
    return (
      <TouchableOpacity
        style={[styles.playButton, { backgroundColor: this.props.mainColor }]}
        onPress={pressAction}
      >
        <Image source={icon} style={styles.playIcon} />
      </TouchableOpacity>
    );
  }

  setLoadingView() {
    return <ActivityIndicator size="large" color="#FFF" />;
  }

  onReplay = () => {
    this.fadeOutControls(5000);
    this.props.onReplay();
  };

  onPause = () => {
    const { playerState, onPaused } = this.props;
    const { PLAYING, PAUSED } = PLAYER_STATE;
    switch (playerState) {
      case PLAYING: {
        return this.cancelAnimation();
      }
      case PAUSED: {
        return this.fadeOutControls(5000);
      }
    }
    onPaused();
  };

  cancelAnimation = () => {
    this.state.opacity.stopAnimation(value => {
      this.setState({ isVisible: true });
    });
  }

  toggleControls = () => {
    // value is the last value of the animation when stop animation was called.
    // As this is an opacity effect, I (Charlie) used the value (0 or 1) as a boolean
    this.state.opacity.stopAnimation(value => {
      this.setState({ isVisible: !!value });
      value ? this.fadeOutControls() : this.fadeInControls();
    });
  };

  fadeOutControls = (delay = 0) => {
    Animated.timing(this.state.opacity, {
      toValue: 0,
      duration: 300,
      delay,
    }).start(result => {
      //I noticed that the callback is called twice, when it is invoked and when it completely finished
      //This prevents some flickering
      if (result.finished) this.setState({ isVisible: false });
    });
  };

  fadeInControls = (loop = true) => {
    this.setState({ isVisible: true });
    Animated.timing(this.state.opacity, {
      toValue: 1,
      duration: 300,
      delay: 0,
    }).start(() => {
      if (loop) {
        this.fadeOutControls(5000);
      }
    });
  };

  dragging = () => {
    if (this.props.playerState === PLAYER_STATE.PAUSED) return;
    this.onPause();
  };

  seekVideo = (value) => {
    this.props.onSeek(value);
    this.onPause();
  }

  renderControls() {
    const {
      duration,
      isLoading,
      mainColor,
      onFullScreen,
      playerState,
      progress,
      toolbar,
    } = this.props;
    //this let us block the controls
    if (!this.state.isVisible) return null;
    return (
      <View style={styles.container}>
        <View style={[styles.controlsRow, styles.toolbarRow]}>{toolbar}</View>
        <View style={[styles.controlsRow]}>
          {isLoading
            ? this.setLoadingView()
            : this.setPlayerControls(playerState)}
        </View>
        <View style={[styles.controlsRow, styles.progressContainer]}>
          <View style={styles.progressColumnContainer}>
            <View style={[styles.timerLabelsContainer]}>
              <Text style={styles.timerLabel}>
                {humanizeVideoDuration(progress)}
              </Text>
              <Text style={styles.timerLabel}>
                {humanizeVideoDuration(duration)}
              </Text>
            </View>
            <Slider
              style={styles.progressSlider}
              onValueChange={this.dragging}
              onSlidingComplete={this.seekVideo}
              maximumValue={Math.floor(duration)}
              value={Math.floor(progress)}
              trackStyle={styles.track}
              thumbStyle={[styles.thumb, { borderColor: mainColor }]}
              minimumTrackTintColor={mainColor}
            />
          </View>
          <TouchableOpacity
            style={styles.fullScreenContainer}
            onPress={onFullScreen}
          >
            <Image source={require('./assets/ic_fullscreen.png')} />
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  render() {
    return (
      <TouchableWithoutFeedback onPress={this.toggleControls}>
        <Animated.View
          style={[styles.container, { opacity: this.state.opacity }]}
        >
          {this.renderControls()}
        </Animated.View>
      </TouchableWithoutFeedback>
    );
  }
}

MediaControls.propTypes = {
  toolbar: PropTypes.node,
  mainColor: PropTypes.string,
  isLoading: PropTypes.bool,
  isFullScreen: PropTypes.bool,
  progress: PropTypes.number,
  duration: PropTypes.number,
  playerState: PropTypes.number,
  onFullScreen: PropTypes.func,
  onPaused: PropTypes.func,
  onReplay: PropTypes.func,
  onSeek: PropTypes.func,
};

MediaControls.defaultProps = {
  mainColor: 'rgba(12, 83, 175, 0.9)',
};

export default MediaControls;