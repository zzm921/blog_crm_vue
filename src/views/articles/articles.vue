<template>
  <div class="app-container">
    <div class="filter-container">
      <!-- <el-select v-model="listQuery.app_key" clearable class="filter-item" @change="handleFilter" filterable>
        <el-option v-for="item in products" :key="item.app_key" :label="item.product_name" :value="item.app_key" />
      </el-select>
      <el-input v-model="listQuery.app_key" placeholder="appkey" style="width: 200px;" class="filter-item" @keyup.enter.native="handleFilter" />
      <el-button v-waves class="filter-item" type="primary" icon="el-icon-search" @click="handleFilter"> 搜索 </el-button> -->
      <el-button class="filter-item" style="margin-left: 10px;" type="primary" icon="el-icon-edit" @click="handleCreate"> 增加 </el-button>
    </div>
    <el-table :key="tableKey" v-loading="listLoading" :data="list" border fit highlight-current-row style="width: 100%;">
      <el-table-column label="标题" width="150">
        <template slot-scope="scope">
          <span style="margin-left: 10px">{{ scope.row.title }}</span>
        </template>
      </el-table-column>
      <el-table-column label="作者" width="150">
        <template slot-scope="scope">
          <span style="margin-left: 10px">{{ scope.row.author }}</span>
        </template>
      </el-table-column>
      <el-table-column label="描述" width="300">
        <template slot-scope="scope">
          <span style="margin-left: 10px">{{ scope.row.description }}</span>
        </template>
      </el-table-column>
      <el-table-column label="类型" width="100">
        <template slot-scope="scope">
          <span style="margin-left: 10px">{{ tagKeyValue[scope.row.tagid] }}</span>
        </template>
      </el-table-column>
      <el-table-column label="封面" width="300">
        <template slot-scope="scope">
          <img :src="scope.row.head_image" />
        </template>
      </el-table-column>
      <el-table-column label="状态" width="300">
        <template slot-scope="scope">
          <span style="margin-left: 10px">{{ scope.row.status }}</span>
        </template>
      </el-table-column>
      <el-table-column label="时间" width="300">
        <template slot-scope="scope">
          <span style="margin-left: 10px">{{ scope.row.createdAt| parseTime('{y}-{m}-{d} {h}:{i}:{s}') }}</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" width="500" class-name="small-padding fixed-width">
        <template slot-scope="scope">
          <el-button type="primary" size="mini" @click="handleUpdate(scope.row)"> 编辑 </el-button>
          <el-button size="small" @click="handleRelease(scope.$index, scope.row)" :type="scope.row.status === 1 ? 'success' : 'primary'" plain="">
            {{ scope.row.status === 1 ? "取消发布" : "正式发布" }}</el-button>
            <el-button size="small" type="danger" @click="handleDelete(scope.$index, scope.row)" plain :disabled="scope.row.status === 1">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
    <pagination v-show="total>0" :total="total" :page.sync="listQuery.page" :limit.sync="listQuery.limit" @pagination="getList" />
    <el-dialog :title="textMap[dialogStatus]" :visible.sync="dialogFormVisible" :close-on-click-modal="false">
      <el-form ref="dataForm" :rules="rules" :model="temp" label-position="left" label-width="100px" style="width: 400px; margin-left:50px;">
        <el-form-item label="标题">
          <el-input v-model="temp.title"></el-input>
        </el-form-item>
        <el-form-item label="作者">
          <el-input v-model="temp.author"></el-input>
        </el-form-item>
        <el-form-item label="标签">
          <el-select v-model="temp.tagid" placeholder="请选择" style="display:block">
            <template v-for="item in tagTypes">
              <el-option :label="item.display_name" :value="item.key" :key="item.key"></el-option>
            </template>
          </el-select>
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="temp.description" type="textarea" rows="3"></el-input>
        </el-form-item>
        <el-form-item label="封面">
          <el-upload class="avatar-uploader" action="http://120.76.64.226:3001/fileUploadOss?type=5" :show-file-list="false" :on-success="handleAvatarSuccess">
            <img v-if="temp.head_image" :src="temp.head_image" class="avatar">
            <i v-else class="el-icon-plus avatar-uploader-icon"></i>
          </el-upload>
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="closeDialog"> 退出 </el-button>
        <el-button type="primary" @click="toContent"> 下一步 </el-button>

      </div>
    </el-dialog>
    <el-dialog title="文章" :visible.sync="dialogContentVisible" :close-on-click-modal="false">
      <div class="editor-container">
        <markdown-editor v-model="temp.content" height="600px" width="60%" />
      </div>
      <div slot="footer" class="dialog-footer">
        <el-button @click="closeDialog"> 退出 </el-button>
        <el-button type="primary" @click="dialogStatus==='create'?createData():updateData()"> 确定 </el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
  import MarkdownEditor from '@/components/MarkdownEditor'
  import { fetchList, fetchArticle, createArticle, updateArticle, deleteArticle } from "@/api/articles";
  import moment from "moment";
  import waves from "@/directive/waves"; // waves directive
  import { parseTime } from "@/utils";
  import Pagination from "@/components/Pagination"; // secondary package based on el-pagination

  const tagTypes = [
    { key: 1, display_name: "音乐" },
    { key: 2, display_name: "生活" }
  ];
  const tagKeyValue = tagTypes.reduce((acc, cur) => {
    acc[cur.key] = cur.display_name;
    return acc;
  }, {});

  export default {
    name: "Articles",
    components: {
      Pagination,
      MarkdownEditor
    },
    directives: {
      waves
    },
    data() {
      return {
        tableKey: 0,
        list: null,
        total: 0,
        listLoading: true,
        listQuery: {
          page: 1,
          limit: 10
        },
        statusOptions: ["published", "draft", "deleted"],
        temp: {
          title: '',
          content: '',
          author: '',
          description: '',
          head_image: '',
          tagid: 0
        },
        upgradeForm: {
          deviceIds: "",
          otaid: "",
          type: ""
        },
        dialogFormVisible: false,
        dialogContentVisible: false,
        dialogStatus: "",
        textMap: {
          update: "修改",
          create: "新建"
        },

        verifyInfoVisible: false,
        upgradevisible: false,
        rules: {},
        tagTypes,
        tagKeyValue,
        products: [],
        verifyInfo: ["验证失败", "开始验证", "验证成功", "验证中"],
        verifyInfoshow: ["验证失败", "验证中", "验证成功"],
        deviceVerifyInfos: []
      };
    },
    created() {
      this.getList()
    },
    methods: {
      toContent() {
        this.dialogFormVisible = false;
        this.dialogContentVisible = true;
        this.$nextTick(() => {
          this.$refs["dataForm"].clearValidate();
        });
      },
      handleAvatarSuccess(res, file) {
        if (res.status == "ok") {
          this.$set(this.temp, 'head_image', res.data.fileurl)
          this.$message({
            message: "上传成功",
            type: "success"
          });
        } else {
          this.$message({
            message: res.msg,
            type: "error"
          });
        }
      },
      getList() {
        this.listLoading = true;
        fetchList(this.listQuery).then(response => {
          this.total = response.count;
          this.list = response.list;
          setTimeout(() => {
            this.listLoading = false;
          }, 0.2 * 1000);
        });
      },
      handleFilter() {
        this.listQuery.page = 1;
        this.getList();
      },
      resetTemp() {
        this.temp = {
          title: '',
          content: '',
          author: '',
          description: '',
          head_image: ''
        };
      },
      handleCreate() {
        this.resetTemp();
        this.customType = [];
        this.dialogStatus = "create";
        this.dialogFormVisible = true;
        this.dialogContentVisible = false;
        this.$nextTick(() => {
          this.$refs["dataForm"].clearValidate();
        });
      },
      createData() {
        this.$refs["dataForm"].validate(valid => {
          if (valid) {
            createArticle(this.temp)
              .then(response => {
                this.dialogFormVisible = false;
                this.dialogContentVisible = false;
                this.$notify({
                  title: "成功",
                  message: "增加成功",
                  type: "success",
                  duration: 2000
                });
                this.getList();
              })
              .catch(e => {
                this.$notify({
                  title: "失败",
                  message: "增加失败",
                  type: "error",
                  duration: 2000
                });
              });
          }
        });
      },
      handleUpdate(row) {
        this.temp = Object.assign({}, row);
        this.dialogStatus = "update";
        this.dialogFormVisible = true;
        this.$nextTick(() => {
          this.$refs["dataForm"].clearValidate();
        });
      },

      closeDialog() {
        this.dialogFormVisible = false;
        this.dialogContentVisible = false;
      },
      updateData() {
        this.$refs['dataForm'].validate((valid) => {
          if (valid) {
            updateArticle(this.temp._id, this.temp).then((response) => {
              this.dialogContentVisible = false
              this.$notify({
                title: '成功',
                message: '更新成功',
                type: 'success',
                duration: 2000
              })
              this.getList()
            }).catch(e => {
              this.$notify({
                title: '失败',
                message: '更新失败',
                type: 'error',
                duration: 2000
              })
            })
          }
        })
      },
      handleDelete(index, row) {
        this.listLoading = true;
        this.$confirm("此操作将永久删除该应用, 是否继续?", "提示", {
            confirmButtonText: "确定",
            cancelButtonText: "取消",
            type: "warning"
          })
          .then(() => {
            deleteArticle(row.id).then(res => {
              this.dialogFormVisible = false;
              this.$notify({
                title: "成功",
                message: "删除成功",
                type: "success",
                duration: 2000
              });
              this.getList();
            });
          })
          .catch(() => {
            this.$message({
              type: "info",
              message: "已取消删除"
            });
          });
        this.listLoading = false;
      },
      closeVerifyInfo() {
        this.deviceVerifyInfos = [];
        this.verifyInfoVisible = false;
      },
      tableheaderClassName({
        row,
        rowIndex
      }) {
        return "table-head-th";
      }
    }
  };
</script>

<style>
  .avatar-uploader .el-upload {
    border: 1px dashed #d9d9d9;
    border-radius: 6px;
    cursor: pointer;
    position: relative;
    overflow: hidden;
  }

  .avatar-uploader .el-upload:hover {
    border-color: #409EFF;
  }

  .avatar-uploader-icon {
    font-size: 28px;
    color: #8c939d;
    width: 178px;
    height: 178px;
    line-height: 178px;
    text-align: center;
  }

  .avatar {
    width: 178px;
    height: 178px;
    display: block;
  }

  .editor-container {
    margin-bottom: 30px;
  }

  .tag-title {
    margin-bottom: 5px;
  }
</style>