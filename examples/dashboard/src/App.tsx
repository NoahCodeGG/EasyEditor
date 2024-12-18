import Center from './components/Center'
import Header from './components/Header'
import Left from './components/Left'
import Right from './components/Right'

const App = () => {
  return (
    <div className='h-screen flex flex-col'>
      {/* <Monitoring
        apiKey=''
        url='https://monitoring.react-scan.com/api/v1/ingest'
        // commit={process.env.COMMIT_HASH}
        // branch={process.env.BRANCH}
        // params={params}
        // path={pathname}
      /> */}
      <Header />
      <div className='flex-1 flex overflow-hidden'>
        <Left />
        <Center />
        <Right />
      </div>
    </div>
  )
}

export default App
