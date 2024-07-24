const { Admin,User,Filter,FilterCategory,Plan,ImageCredit,Order } = require('../models'); 
const express = require('express');
const app = express();
const path = require('path');

// Define the directory for static files (uploads folder)
const uploadsDirectory = path.join(__dirname, 'uploads');
// Middleware to serve static files
app.use('/uploads', express.static(uploadsDirectory));// Adjust path as per your project structure

exports.admin_user = async (req, res) => {
    try 
    {
      const user = await Admin.findByPk(req.userId); 
      res.json({ user });
    } 
    catch (error) 
    {
      res.status(500).json({ error: 'Failed to fetch profile' });
    }
}

exports.get_all_users = async (req, res) => {
    try 
    {
      // const users = await User.findAll();
      const users = await User.findAll({
        where: {
          deletedAt: null // Filter out soft-deleted users
        }
      });
      res.json(users);
    } 
    catch (error) 
    {
      res.status(500).json({ error: 'Failed to fetch users' });
    }
}

exports.user_status_update = async (req, res) => {

    const { userId, newStatus } = req.body;
    try 
    {
      // Update user's isActive status
      const updatedUser = await User.update({ is_active: newStatus }, {
        where: { id: userId }
      });
  
      if (updatedUser[0] === 1) 
      {
        res.json({ message: 'User status updated successfully' ,update_user: updatedUser[0]});
      } 
      else 
      {
        res.status(404).json({ error: 'User not found or status not updated', update_user: 0 });
      }
    } 
    catch (error) 
    {
      console.error('Error updating user status:', error);
      res.status(500).json({ error: 'Failed to update user status' });
    }

}
exports.user_delete = async (req, res) => {
    const userId = req.params.id;
  try 
  {
    const user = await User.findByPk(userId);
    if (!user) 
    {
      return res.status(404).json({ error: 'User not found' });
    }
    // Soft delete user by setting deletedAt timestamp
    await user.update({ deletedAt: new Date() });
    res.json({ message: `User ${userId} soft-deleted successfully` });
  } 
  catch (error) 
  {
    console.error(`Error soft-deleting user ${userId}:`, error);
    res.status(500).json({ error: `Failed to soft-delete user ${userId}` });
  }
}

// Filters Logic

exports.add_filter_data = async (req, res) => {

  const { category_id, filter, api_key } = req.body;
  const file = req.file;
  const image = file.path;
  console.log(req,"Filter Api");
  try 
  {
    const add_filters_data = await Filter.create({ category_id, filter,api_key,image });
    return res.status(200).send({ message: 'Filter Data.', filters: add_filters_data });
    
  } 
  catch (error) 
  {
    res.status(500).json({ error: 'Login failed' });
  }
}

exports.get_filters_data = async (req, res) => {
        try {
          // Fetch all data from the FilterCategory model
          const allFilterCategories = await FilterCategory.findAll({
            where: {
              deletedAt: null // Filter out soft-deleted users
            }
          });
        
          // Fetch matched data from the Filter model with the corresponding FilterCategory
          const filters = await Filter.findAll({
            attributes: ['id', 'image', 'filter','api_key', 'category_id'], // Include all necessary attributes of Filter
            include: {
              model: FilterCategory,
              attributes: ['id', 'name', 'order_no'] // Include specific attributes of FilterCategory
            },
            where: {
              deletedAt: null // Filter out soft-deleted users
            }
          });
        
          // Format the response by grouping filters by category_id
          const groupedFilters = filters.reduce((acc, filter) => {
            const categoryId = filter.category_id;
            if (!acc[categoryId]) {
              acc[categoryId] = {
                category_id: categoryId,
                category_name: filter.FilterCategory.name,
                order_no: filter.FilterCategory.order_no,
                sub_categories: []
              };
            }
            acc[categoryId].sub_categories.push({
              id: filter.id,
              image: filter.image,
              filter: filter.filter,
              api_key: filter.api_key
            });
            return acc;
          }, {});
        
          // Convert the grouped object into an array
          const groupedFiltersArray = Object.values(groupedFilters);
        
          // Merge the data from FilterCategory and grouped filters
          const result = allFilterCategories.map(category => {
            return {
              ...category.dataValues,
              sub_categories: groupedFilters[category.id] ? groupedFilters[category.id].sub_categories : []
            };
          });
        
          return res.status(200).send({ message: 'Filter Data.', filters: result });
        } catch (error) {
          console.error(error);
          return res.status(500).send({ message: 'Error fetching filter data.', error });
        }
        

}

exports.edit_filter_category = async (req, res) => {
    const filtercatId = req.params.id;
  try 
  {
    const filter_cat = await FilterCategory.findByPk(filtercatId);
    if (!filter_cat) 
    {
      return res.status(404).json({ error: 'Filter Category not found' }); 
    }
    res.json({ message: `Edit Data get successfully`,filter_cat_data:  filter_cat});
  } 
  catch (error) 
  {
    console.error(`Error soft-deleting user ${userId}:`, error);
    res.status(500).json({ error: `Failed to soft-delete user ${userId}` });
  }
}

exports.update_filter_category = async (req, res) => {

    const {name,order_no,cat_id } = req.body;

    try 
    {
      // Update user's isActive status
      const updatedFilterCat = await FilterCategory.update({ name: name,order_no: order_no }, {
        where: { id: cat_id }
      });
      res.json({ message: 'Filter Category updated successfully' ,update_filter_cat: updatedFilterCat[0]});
    
    } 
    catch (error) 
    {
      console.error('Error updating user status:', error);
      res.status(500).json({ error: 'Failed to update user status' });
    }

}

exports.delete_filter_category = async (req, res) => {
    const filtercatId = req.params.id;
  try 
  {
    const filter_cat = await FilterCategory.findByPk(filtercatId);
    if (!filter_cat) 
    {
      return res.status(404).json({ error: 'Filter Category not found' }); 
    }
    // Soft delete user by setting deletedAt timestamp
    await filter_cat.update({ deletedAt: new Date() });
    res.json({ message: `FilterCategory ${filtercatId} soft-deleted successfully` });
  } 
  catch (error) 
  {
    console.error(`Error soft-deleting user ${userId}:`, error);
    res.status(500).json({ error: `Failed to soft-delete user ${userId}` });
  }
}

exports.delete_filters_data = async (req, res) => {
    const filterId = req.params.id;
  try 
  {
    const filter = await Filter.findByPk(filterId);
    if (!filter) 
    {
      return res.status(404).json({ error: 'Filter not found' });
    }
    // Soft delete user by setting deletedAt timestamp
    await filter.update({ deletedAt: new Date() });
    res.json({ message: `Filter ${filterId} soft-deleted successfully` });
  } 
  catch (error) 
  {
    console.error(`Error soft-deleting user ${userId}:`, error);
    res.status(500).json({ error: `Failed to soft-delete user ${userId}` });
  }
}

exports.add_filters_category = async (req, res) => { 
    const { name, order_no } = req.body;
  try 
  {
    const add_filters_category = await FilterCategory.create({ name, order_no });
    return res.status(200).send({ message: 'Filter Data.', add_filters_category: add_filters_category });
    //res.json({ message: 'User status updated successfully' ,add_filters_category: add_filters_category});
    
  } 
  catch (error) 
  {
    res.status(500).json({ error: 'Login failed' });
  }
}

exports.get_filters_category = async (req, res) => {
    try 
   {
    const categories = await FilterCategory.findAll({
      where: {
        deletedAt: null // Filter out soft-deleted users
      }
    });
    res.json(categories);
   } 
   catch (error) 
  {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
}

// Plan logic

exports.add_plan_data = async (req, res) => {

  const { label, value, credit } = req.body;
  try 
  {
    const add_credit_data = await Plan.create({ label, value, credit });
    return res.status(200).send({ message: 'Credit Data.', add_credit_data: add_credit_data });
    
  } 
  catch (error) 
  {
    res.status(500).json({ error: 'Login failed' });
  }
}

exports.get_plan_data = async (req, res) => {
    try 
  {
    // const users = await User.findAll();
    const credit_data = await Plan.findAll({
      where: {
        deletedAt: null // Filter out soft-deleted users
      }
    });
    res.json(credit_data);
  } 
  catch (error) 
  {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
}

exports.edit_plan_data = async (req, res) => {
    const creditId = req.params.id;
  try 
  {
    const credit_data = await Plan.findByPk(creditId);
    if (!credit_data) 
    {
      return res.status(404).json({ error: 'Filter Category not found' }); 
    }
    res.json({ message: `Edit Data get successfully`,credit_edit_data:  credit_data});
  } 
  catch (error) 
  {
    console.error(`Error soft-deleting user ${creditId}:`, error);
    res.status(500).json({ error: `Failed to soft-delete user ${creditId}` });
  }
}

exports.update_plan_data = async (req, res) => {
    const {label,value,credit,credit_id } = req.body;

    try 
    {
      // Update user's isActive status
      const updatedFilterCat = await Plan.update({ label: label,value: value,credit:credit }, {
        where: { id: credit_id }
      });
      res.json({ message: 'Filter Category updated successfully' ,update_filter_cat: updatedFilterCat[0]});
    
    } 
    catch (error) 
    {
      console.error('Error updating user status:', error);
      res.status(500).json({ error: 'Failed to update user status' });
    }
}

exports.delete_plan_data = async (req, res) => {
    const creditId = req.params.id;
    try 
    {
      const credit_data = await Plan.findByPk(creditId);
      if (!credit_data) 
      {
        return res.status(404).json({ error: 'Filter Category not found' }); 
      }
      // Soft delete user by setting deletedAt timestamp
      await credit_data.update({ deletedAt: new Date() });
      res.json({ message: `Plan ${creditId} soft-deleted successfully` });
    } 
    catch (error) 
    {
      console.error(`Error soft-deleting user ${creditId}:`, error);
      res.status(500).json({ error: `Failed to soft-delete user ${creditId}` });
    }
}

exports.set_credit_plan = async (req, res) => {

    const { image_credit } = req.body;
    try {
      let set_credit_data;
  
      // Check if there is already existing data
      const existingCreditData = await ImageCredit.findOne();
  
      if (existingCreditData) {
        // Update the existing entry
        existingCreditData.image_credit = image_credit;
        set_credit_data = await existingCreditData.save();
      } else {
        // Create a new entry
        set_credit_data = await ImageCredit.create({ image_credit }); 
      }
  
      return res.status(200).send({ message: 'Credit Data.', set_credit_data });
      
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Error occurred.' });
    }
}

// Order Logic

exports.get_orders_data = async (req, res) => {

    try 
    {
      // const users = await User.findAll();
      const orders_data = await Order.findAll({
        where: {
          deletedAt: null // Filter out soft-deleted users
        }
      });
      res.json(orders_data);
    } 
    catch (error) 
    {
      res.status(500).json({ error: 'Failed to fetch users' });
    }
}
