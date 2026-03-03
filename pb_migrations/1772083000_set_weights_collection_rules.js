migrate((app) => {
  const weightsCollection = app.findCollectionByNameOrId('weights');

  if (!weightsCollection) {
    return null;
  }

  weightsCollection.listRule = '@request.auth.id = user';
  weightsCollection.viewRule = '@request.auth.id = user';
  weightsCollection.createRule = 'user = @request.auth.id';
  weightsCollection.updateRule = '@request.auth.id = user';
  weightsCollection.deleteRule = '@request.auth.id = user';

  return app.save(weightsCollection);
}, (app) => {
  const weightsCollection = app.findCollectionByNameOrId('weights');

  if (!weightsCollection) {
    return null;
  }

  weightsCollection.listRule = null;
  weightsCollection.viewRule = null;
  weightsCollection.createRule = null;
  weightsCollection.updateRule = null;
  weightsCollection.deleteRule = null;

  return app.save(weightsCollection);
})
