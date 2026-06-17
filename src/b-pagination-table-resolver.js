import packageConfig from '../package.json';

const ComponentName = 'BPaginationTable';
const BPaginationTableResolver = () => {
  const resolvers = [
    {
      type: 'component',
      resolve: (name) => {
        if (name === ComponentName) {
          return { name: ComponentName, from: packageConfig.name };
        }
      }
    }
  ];
  return resolvers;
};

export default BPaginationTableResolver;
