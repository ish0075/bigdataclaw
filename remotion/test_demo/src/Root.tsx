import { Composition } from 'remotion';
import { AgentShowcase } from './AgentShowcase';
import './styles.css';

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="AgentShowcase"
        component={AgentShowcase}
        durationInFrames={900} // 30 seconds at 30fps
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{
          agentName: "Transaction Scout",
          agentIcon: "🎯",
          taskDescription: "Searching for recent commercial real estate transactions",
          steps: [
            { frame: 0, text: "Initializing search..." },
            { frame: 90, text: "Querying database..." },
            { frame: 180, text: "Found 47 transactions" },
            { frame: 270, text: "Analyzing matches..." },
            { frame: 450, text: "Complete! 12 hot money leads identified" }
          ]
        }}
      />
    </>
  );
};
