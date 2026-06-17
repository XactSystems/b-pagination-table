const BPaginationTableResolver = () => {
  const resolvers = [
    {
      type: 'component',
      resolve: (name) => {
        if (name === 'BPaginationTable') {
          return { name: 'default', from: '@xactsystems/b-pagination-table' };
        }
      }
    }
  ];
  return resolvers;
};

export default BPaginationTableResolver;
