# Processing *Unknown Name*s step by step

- *Unknown name* - a new name for the system (DB);
- *Entity* - is a name with or without wikipedia info;
- *Topic* - a topic is an unique identified entity;


#### [Explorer](lib/explorer.js) - foreach *unknown name*:
  1. Find *item*'s names:
    #### [NameExplorer](lib/name_explorer.js) - for a given unknown name:
    1. Find name populatiry - get from google search results;
    2. Find all posible name's variants:
      1. Correct spelling name - detect in google search;
      2. Name version: *Putin Vladimir* can be *Vladimir Putin*;
    3. Filter popular names - get only popular names, known by google in unknown names's culture;

  2. Find *entities* by *item name*s:
    #### [EntityExplorer](lib/entity_explorer.js) - Foreach *item name*:
    1. Explore entity:
      1. Identify article on Wikipedia corresponding with the searching name;
      2. Get entity details from Wikipedia article (id, title, langlinks, redirects);
      3. Find english version of Wikipedia article;
    2. Filter entities;
    3. Create unique names for each entity;
  3. If is an EXISTING *topic*:
    1. DB: Save new unique names to existing topic;
  4. If is a NEW *topic*:
    #### [TopicManager](lib/topic_manager.js)
    1. Build topic - create a DB model object;
    2. Find pictures:
      #### [ImagesExplorer](lib/images_explorer.js)
      1. Find topic pictures;
    3. DB: Save topic pictures;
    4. DB: Save topic;

  5. Remove processed *unknown name*.
