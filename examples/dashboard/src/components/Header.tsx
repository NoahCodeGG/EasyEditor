import { Link, useLocation } from 'react-router-dom'

const Header = () => {
  const location = useLocation()
  const isDevPage = location.pathname === '/component-dev'

  return (
    <div className='h-14 flex items-center px-4 border-b border-gray-200 justify-between'>
      <div className='text-xl font-bold'>EasyEditor</div>

      <div className='flex gap-4'>
        <Link
          to='/'
          className={`px-3 py-2 rounded-md hover:bg-gray-100 transition-colors ${isDevPage ? '' : 'bg-gray-100 font-medium'}`}
        >
          编辑器
        </Link>
        <Link
          to='/component-dev'
          className={`px-3 py-2 rounded-md hover:bg-gray-100 transition-colors ${isDevPage ? 'bg-gray-100 font-medium' : ''}`}
        >
          组件开发
        </Link>
      </div>
    </div>
  )
}

export default Header
