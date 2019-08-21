<template>
  <div class="root">
    <Spin size="large" fix v-if="spinShow"></Spin>
    <div>
      <Button type="primary" @click="selectFile">选择文件</Button>
      <Row style="margin-top:8px;margin-bottom:8px;">
        <Col :span="8">
          <Input search enter-button="查询" placeholder="请输入表名" class="search_table"/>
          <Button @click="exportWord">导出Word</Button>
        </Col>
      </Row>
    </div>
    <Tabs type="card" closable v-model="currentTab" @on-tab-remove="handleTabRemove">
      <TabPane v-for="model in models" :key="model.name" :label="model.name">
        <div style="text-align:center;margin-bottom:8px;">
          <Page @on-change="pageChange" :total="tablesChunk(model.tables).length" :page-size="pageSize" />
        </div>
        <Row v-for="(tableChunk,index) in currentData" :key="index" :gutter="16" style="margin-bottom: 8px;">
          <Col span="8" v-for="table in tableChunk" :key="table.name">
            <Card class="tableCard">
              <p slot="title">
                {{table.name}}
              </p>
              <Table border :columns="tableColumns" :data="table.columns" :height="450"></Table>
            </Card>
          </Col>
        </Row>
        <div style="text-align:center;">
          <Page :current="currentPage" @on-change="pageChange" :total="tablesChunk(model.tables).length" :page-size="pageSize" />
        </div>
      </TabPane>
    </Tabs>
    <BackTop />
  </div>
</template>

<script>
import xmlreader from 'xmlreader';
import fs from 'fs';
import chunk from 'lodash/chunk';
import findIndex from 'lodash/findIndex';
import {
  Document, WidthType, Packer, Paragraph,
} from 'docx';

export default {
  data: () => ({
    drawer: null,
    models: [],
    spinShow: false,
    currentTab: 0,
    currentPage: 1,
    currentData: [],
    pageSize: 3,
    tableColumns: [
      {
        title: '字段名',
        key: 'code',
        render: (h, params) => {
          if (params.row.primaryKey) {
            return h('div', [
              h('strong', params.row.code),
              h('Icon', {
                props: {
                  type: 'ios-key',
                },
                style: {
                  marginLeft: '5px',
                },
              }),
            ]);
          }
          return h('div', params.row.code);
        },
      },
      {
        title: '数据类型',
        key: 'dataType',
      },
      {
        title: '名称',
        key: 'name',
      },
    ],
  }),
  props: {
    source: String,
  },
  computed: {},
  watch: {
    currentTab(newValue, oldValue) {
      if (newValue !== oldValue) {
        this.currentPage = 1;
        this.$nextTick(() => {
          const dataIndex = parseInt(this.currentTab, 10);
          if (this.models.length >= dataIndex && dataIndex >= 0) {
            const chunkArray = this.tablesChunk(this.models[dataIndex].tables, this.currentPage);
            this.currentData = chunkArray;
          }
        });
      }
    },
  },
  methods: {
    handleTabRemove(tabIndex) {
      const model = this.models[tabIndex];
      const modelCaches = localStorage.getItem('modelCaches');
      // 移除localStorage
      if (modelCaches) {
        const array = JSON.parse(modelCaches);
        const index = findIndex(array, o => o.filePath === model.filePath);
        if (index !== -1) {
          array.splice(index, 1);
        }
        localStorage.setItem('modelCaches', JSON.stringify(array));
      }
      // 移除数据存储
      this.models.splice(tabIndex, 1);
    },
    pageChange(page) {
      this.currentPage = page;
      const dataIndex = parseInt(this.currentTab, 10);
      if (this.models.length >= dataIndex && dataIndex >= 0) {
        const chunkArray = this.tablesChunk(this.models[dataIndex].tables, this.currentPage);
        this.currentData = chunkArray;
      }
    },
    tablesChunk(tables, currentPage) {
      if (currentPage) {
        const allChunk = chunk(tables, 3);
        const pageStart = this.pageSize * (currentPage - 1);
        const pageEnd = pageStart + this.pageSize;
        return allChunk.filter((chunkArray, index) => index >= pageStart && index <= pageEnd);
      }
      return chunk(tables, 3);
    },
    exportWord() {
      const { dialog } = this.$electron.remote;
      dialog.showSaveDialog({
        filters: [{ name: 'docx', extensions: ['docx'] }],
      }, (filename) => {
        if (filename) {
          const doc = new Document();
          const dataIndex = parseInt(this.currentTab, 10);
          const data = this.models[dataIndex];
          const { tables } = data;
          tables.forEach((t) => {
            if (t.name.indexOf('废弃') !== -1) {
              return;
            }
            const table = doc.createTable(t.columns.length + 2, 3);
            table.setWidth(WidthType.PERCENTAGE, 4900);
            // table.setFixedWidthLayout();
            table.getCell(0, 0).addContent(new Paragraph('表名'));
            table.getCell(0, 2).delete();
            table.getCell(0, 1).addContent(new Paragraph(t.name));
            table.getCell(0, 1).CellProperties.addGridSpan(2);

            table.getCell(1, 0).CellProperties.setWidth(1500, 'pct');
            table.getCell(1, 0).addContent(new Paragraph('字段名'));

            table.getCell(1, 1).CellProperties.setWidth(1500, 'pct');
            table.getCell(1, 1).addContent(new Paragraph('数据类型'));

            table.getCell(1, 2).CellProperties.setWidth(2000, 'pct');
            table.getCell(1, 2).addContent(new Paragraph('备注'));
            t.columns.forEach((c, index) => {
              table.getCell(index + 2, 0).addContent(new Paragraph(c.code));
              table.getCell(index + 2, 1).addContent(new Paragraph(c.dataType));
              table.getCell(index + 2, 2).addContent(new Paragraph(c.name));
            });
            const paragraph = new Paragraph();
            doc.addParagraph(paragraph);
          });
          const packer = new Packer();
          packer.toBuffer(doc).then((buffer) => {
            fs.writeFileSync(filename, buffer);
          });
        }
      });
    },
    renderTabPanelName(model) {
      return h => h('div', [
        h('span', model.name),
        h('Badge', {
          props: {
            count: model.tables.length,
          },
          style: {
            marginLeft: '8px',
          },
        }),
      ]);
    },
    readModel(filePath) {
      this.spinShow = true;
      fs.stat(filePath, (err, stat) => {
        if (stat && stat.isFile()) {
          const modelCaches = localStorage.getItem('modelCaches');
          if (modelCaches) {
            const array = JSON.parse(modelCaches);
            const index = findIndex(array, o => o.filePath === filePath);
            if (index === -1) {
              array.push({ filePath });
            }
            localStorage.setItem('modelCaches', JSON.stringify(array));
          } else {
            localStorage.setItem('modelCaches', JSON.stringify([{ filePath }]));
          }
          // 判断文件已经被解析
          const index = findIndex(this.models, o => o.filePath === filePath);
          let extractModel = {};
          if (index > -1) {
            extractModel = this.models[index];
          }
          const buf = fs.readFileSync(filePath);
          xmlreader.read(buf.toString(), (errors, response) => {
            if (errors !== null) {
              console.log(errors);
              this.$Loading.error();
            }
            const model = response.Model['o:RootObject']['c:Children']['o:Model'];
            extractModel.filePath = filePath;
            extractModel.name = model['a:Name'].text();
            const tables = model['c:Tables']['o:Table'].array;
            extractModel.tables = tables.map((t) => {
              const columnsArray = t['c:Columns']['o:Column'].array;
              const columns = columnsArray.map(column => ({
                name: column['a:Name'].text(),
                code: column['a:Code'].text(),
                comment: column['a:Comment'] ? column['a:Comment'].text() : '',
                primaryKey: column['a:Column.Mandatory']
                  ? column['a:Column.Mandatory'].text() === '1'
                  : false,
                dataType: column['a:DataType'].text(),
                creator: column['a:Creator'].text(),
              }));
              return {
                name: t['a:Name'].text(),
                columns,
              };
            });
            if (index === -1) {
              this.models.push(extractModel);
            }
            this.pageChange(1);
            this.spinShow = false;
          });
        }
      });
    },
    selectFile() {
      this.$electron.remote.dialog.showOpenDialog(
        {
          filters: [{ name: 'pdm', extensions: ['pdm'] }],
          prperties: ['openFile'],
        },
        (files) => {
          if (files && files.length > 0) {
            this.readModel(files[0]);
            this.currentTab = 0;
          }
        },
      );
    },
  },
  mounted() {
    const modelCaches = localStorage.getItem('modelCaches');
    if (modelCaches) {
      const array = JSON.parse(modelCaches);
      array.forEach((file) => {
        this.readModel(file.filePath);
      });
      if (array.length > 0) {
        this.currentTab = 0;
      }
    }
  },
};
</script>
<style>
.tableCard .ivu-card-head {
  border-bottom: 0;
}
.tableCard .ivu-card-body {
  padding: 0;
}
</style>

<style scoped>
.root {
  padding: 15px;
}
.search_table {
  display: inline-table;
  width:70% !important;
}
</style>
