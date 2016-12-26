/**
 * @class Hierarchy
 * @classdesc Class to create Hierarchical structure from database table
 *
 * @constructs Hierarchy
 * @param {Object} globals - object of global report variables {pageContext: this.pageContext, report: report, user: user, state: state, confirmit: confirmit, log: log}
 * @param {Object} settings - object containing idColumnName, textColumnName, relationshipColumnName, textSeparator
 *
 */
class Hierarchy{
    private var _globals;
    private var _settings;

    private var _hierarchy;
    private var _levels = [];
  	private var _flat;
    
    private var _defaultSettings = {
        idColumnName: "id",
        textColumnName: "__l9",
        relationshipColumnName: "parent",
        textSeparator: "|",
        additionalColumns: []
    };

    function Hierarchy(globals, settings) {
      _globals = globals;
      _settings = _mixin(_defaultSettings, settings);
      _flat = _generateFlatList(_getTable());
	}

    /**
     * @memberof Hierarchy
     * @private
     * @instance
     * @function _mergeOptions
     * @description function to merge two sets of settings
     * @param {Object} obj1
     * @param {Object} obj2
     * @returns {Object}
     */
    private function _mixin(to, from) {
        for (var attr in from) {
            to[attr] = from[attr];
        }
        return to;
    }

    /**
     * @memberof Hierarchy
     * @private
     * @instance
     * @function _getTable
     * @description function to get DBDesignerTable from DatabaseDesigner
     * @returns {DBDesignerTable}
     */
  private function _getTable() {
    var schema = _globals.confirmit.GetDBDesignerSchema(_settings.schemaId);
   return schema.GetDBDesignerTable(_settings.tableName);
}

    /**
     * @memberof Hierarchy
     * @private
     * @instance
     * @function _generateFlatList
     * @description creating list of rows for variable _flat
     * @param {Object} rows - list of rows from db table
     */
    private function _generateFlatList(table) {
      var rows = table.GetDataTable().Rows,
          ac = _settings.additionalColumns,
      	  additionalColumns = _getAdditionalColumns(table,ac),
          h={};
           
        for(var i = 0; i < rows.Count; ++i) {
            var flatEntry = _createFlatEntry(rows[i]);
          if(ac.length>0 && additionalColumns.length>0){ //add additional columns
            for(var c in additionalColumns){
              var colval = additionalColumns[c][i];
              if(colval && (colval).ToString().length>0)flatEntry[c] = colval;
            }
          }
          h[flatEntry.id]=flatEntry;
      	}
      return h
	}
  
    /**
     * @memberof Hierarchy
     * @private
     * @instance
     * @function _getAdditionalColumns
     * @description gets additional columns from hierarchy if any
     * @param {DBDesignerTable} table - db table
     * @param {Array.<String>} ac - additional columns
     * @returns {Objecte} Returns an object with column name as key and String Collection as value
     */
  private function _getAdditionalColumns(table, ac){
    var c={};
    if(ac.length>0){
      for(var i=0;i<ac.length;i++){
      	c[ac[i]] = table.GetColumnValues(_settings.textColumnName+ac[i]);
      }
    }
    return c;
  }

    /**
     * @memberof Hierarchy
     * @function GetSelfName
     * @description function to trim out parents cateories from the category name
     * @param {String} name
     * @param {String} separator
     * @returns {String}
     */
    static function GetSelfName(name, separator){
        var index = name.lastIndexOf(separator);
        return name.slice((index+1)).Trim();
    }

    /**
     * @memberof Hierarchy
     * @private
     * @instance
     * @function _createFlatEntry
     * @description creating object from db table row
     * @param {Object} row - db table row
     * @returns {Object}
     */
    private function _createFlatEntry(row) {
      var name = GetSelfName(row[_settings.textColumnName], _settings.textSeparator);
       return {
          id: row[_settings.idColumnName].toLowerCase(),
          text: row[_settings.textColumnName],
          name: name,
          parent: row[_settings.relationshipColumnName] ? row[_settings.relationshipColumnName].toLowerCase() : null        
      };
	}

    /**
     * @memberof Hierarchy
     * @instance
     * @function GetHierarchyArray
     * @description function to get Array of hierarchical objects
	 * @returns {Array.<Object>}
     */
    function GetHierarchyArray() {
      if(_hierarchy.length==0){_setupHierarchy();}
      return _hierarchy;
	}
  


    /**
     * @memberof Hierarchy
     * @instance
     * @function GetLevelArray
     * @description function to get Array of hierarchical objects of particular level
     * @param {Number} level
     * @returns {Object[]}
     */
    function GetLevelArray(level) {
        if(_levels.length==0){_setupHierarchyLevels(_hierarchy,0);}
        if(_levels.length > level) {
            return _levels[level];
        }else{
            throw new Error(201, "Hierarchy level index is out of range");
        }
    }

    /**
     * @memberof Hierarchy
     * @instance
     * @function GetLevelsCount
     * @description function to get Count of levels in the hierarchy
     * @returns {Number}
     */
    function GetLevelsCount() {
      if(_levels.length==0){_setupHierarchyLevels(_hierarchy,0);}
   	  return _levels.length
	}

    /**
     * @memberof Hierarchy
     * @instance
     * @function GetFlatHierarchy
     * @description function to get Array of rows from db table
     * @returns {Number}
     */
    function GetFlatHierarchy() {
    	return _flat;
	}

    /**
     * @memberof Hierarchy
     * @instance
     * @function GetObjectById
     * @description function to get particular row from db table
     * @param {String} id
     * @returns {Object}
     */
    function GetObjectById(id) {
      if(_flat[id]){
        return _flat[id]
      } else {
        throw new Error(201, "Hierarchy object id doesn't exist")
      }      
    }
  
      /**
     * @memberof Hierarchy
     * @private
     * @instance
     * @function _setupHierarchy
     * @description recursive function to parse db table to hierarchical view
     * @param {Number} level
     * @param {Number} parentObj
     */
    private function _setupHierarchyLevels(hierarchy,lvl) {
      if(_hierarchy==undefined){_hierarchy = _setupHierarchy()}
      if(hierarchy){
        if(!_levels[lvl]){_levels[lvl] = []}
        for(var i=0;i<hierarchy.length;i++){
          _levels[lvl].push(hierarchy[i]);
          if(hierarchy[i].subcells){
            _setupHierarchyLevels(hierarchy[i].subcells, lvl+1)
          }
        }      	
      }
    }
  

    /**
     * @memberof Hierarchy
     * @private
     * @instance
     * @function _setupHierarchy
     * @description recursive function to parse db table to hierarchical view
     * @param {Number} level
     * @param {Number} parentObj
     */
    private function _setupHierarchy( level, parentObj ) {
        var orphans = [];
        for(var key in _flat){
          var item = _flat[key];
          // map item to parent
          if(item.parent && item.parent!=null && item.parent.length>0){
            var parent = _flat[item.parent];
            parent.subcells = parent.subcells || [];
            parent.subcells.push(item);
          } else {
            orphans.push(item);
          }
        }
        return orphans
    }
}
