import dynamic from 'next/dynamic';


const DynamicComponent = dynamic(() => import('./SomeComponent'), {
  ssr: false,
  loading: () => <p>Loading...</p>
});

export default DynamicComponent;
